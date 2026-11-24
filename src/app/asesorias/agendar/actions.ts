"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/sesion-servidor";
import { aFechaBD, diaDeSemana, sePuedeAgendar, seEmpalman, validarTema } from "@/lib/agenda";

export type EstadoAgendar = { error?: string; tema?: string; fecha?: string };

const ACTIVAS = ["PENDIENTE", "CONFIRMADA", "COMPLETADA"] as const;

// HU-05: el estudiante agenda un horario libre. Todas las reglas se revisan en el servidor.
export async function agendarAsesoria(_prev: EstadoAgendar, formData: FormData): Promise<EstadoAgendar> {
  const { sub: estudianteId } = await exigirSesion("ESTUDIANTE");
  const disponibilidadId = String(formData.get("disponibilidad") ?? "");
  const materiaId = String(formData.get("materia") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const tema = String(formData.get("tema") ?? "").trim();
  const conservar = { tema, fecha };

  const errorTema = validarTema(tema);
  if (errorTema) return { error: errorTema, ...conservar };

  // El horario debe existir y el tutor debe asesorar esa materia
  const bloque = await prisma.disponibilidad.findFirst({
    where: { id: disponibilidadId, tutor: { rol: "TUTOR", materiasQueImparte: { some: { materiaId } } } },
  });
  if (!bloque) return { error: "Ese horario ya no está disponible. Vuelve a la búsqueda.", ...conservar };
  if (bloque.tutorId === estudianteId) return { error: "No puedes agendar contigo mismo.", ...conservar };

  // La fecha debe caer en el día del bloque y con al menos 2 horas de anticipación
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || diaDeSemana(fecha) !== bloque.diaSemana) {
    return { error: "Elige una de las fechas de la lista.", ...conservar };
  }
  if (!sePuedeAgendar(fecha, bloque.horaInicio, new Date())) {
    return { error: "Las asesorías se agendan con al menos 2 horas de anticipación.", ...conservar };
  }

  try {
    // Transacción serializable: dos estudiantes no pueden quedarse con el mismo horario al mismo tiempo
    await prisma.$transaction(async (tx) => {
      const ocupadas = await tx.asesoria.findMany({
        where: { fecha: aFechaBD(fecha), estado: { in: [...ACTIVAS] }, OR: [{ tutorId: bloque.tutorId }, { estudianteId }] },
        select: { tutorId: true, horaInicio: true, horaFin: true },
      });
      const choque = ocupadas.find((a) => seEmpalman(a, bloque));
      if (choque) throw new Error(choque.tutorId === bloque.tutorId ? "OCUPADO" : "EMPALME_ESTUDIANTE");

      await tx.asesoria.create({
        data: {
          estudianteId, tutorId: bloque.tutorId, materiaId, fecha: aFechaBD(fecha),
          horaInicio: bloque.horaInicio, horaFin: bloque.horaFin, modalidad: bloque.modalidad, lugar: bloque.lugar, tema,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (e) {
    const codigo = e instanceof Error ? e.message : "";
    if (codigo === "EMPALME_ESTUDIANTE") return { error: "Ya tienes otra asesoría que se empalma con ese horario.", ...conservar };
    const ocupado = codigo === "OCUPADO"
      || (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2002" || e.code === "P2034"));
    if (ocupado) return { error: "Ese horario acaba de ocuparse. Elige otra fecha.", fecha: "", tema };
    console.error(e);
    return { error: "No se pudo agendar la asesoría. Intenta de nuevo.", ...conservar };
  }

  revalidatePath("/mis-asesorias");
  redirect("/mis-asesorias?aviso=agendada");
}
