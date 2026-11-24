"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/sesion-servidor";
import { validarBloque, type DatosBloque } from "@/lib/agenda";

export type EstadoBloque = { errores?: Partial<Record<keyof DatosBloque, string>>; valores?: Record<string, string> };

// HU-03: el tutor agrega o edita un bloque semanal sin empalmarse con sus otros bloques
export async function guardarBloque(_prev: EstadoBloque, formData: FormData): Promise<EstadoBloque> {
  const { sub: tutorId } = await exigirSesion("TUTOR");
  const entrada = Object.fromEntries(formData) as Record<string, string>;
  const id = entrada.id || undefined;

  // Si se edita, el bloque debe ser del tutor que tiene la sesión
  if (id && !(await prisma.disponibilidad.findFirst({ where: { id, tutorId }, select: { id: true } }))) {
    redirect("/tutor/disponibilidad");
  }

  const otros = await prisma.disponibilidad.findMany({
    where: { tutorId, id: id ? { not: id } : undefined },
    select: { diaSemana: true, horaInicio: true, horaFin: true },
  });
  const resultado = validarBloque(entrada, otros);
  if (!resultado.ok) return { errores: resultado.errores, valores: entrada };

  if (id) await prisma.disponibilidad.update({ where: { id }, data: resultado.datos });
  else await prisma.disponibilidad.create({ data: { ...resultado.datos, tutorId } });

  revalidatePath("/asesorias");
  redirect(`/tutor/disponibilidad?guardado=${id ? "editado" : "nuevo"}`);
}

export async function eliminarBloque(formData: FormData): Promise<void> {
  const { sub: tutorId } = await exigirSesion("TUTOR");
  // deleteMany con tutorId: un tutor no puede borrar bloques de otro
  await prisma.disponibilidad.deleteMany({ where: { id: String(formData.get("id")), tutorId } });
  revalidatePath("/asesorias");
  redirect("/tutor/disponibilidad?guardado=eliminado");
}
