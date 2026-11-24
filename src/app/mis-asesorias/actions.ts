"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/sesion-servidor";
import { deFechaBD, puedeCancelar, yaPaso } from "@/lib/agenda";

// Solo participa quien es el estudiante o el tutor de la asesoría
async function asesoriaDelUsuario(id: string, usuarioId: string) {
  return prisma.asesoria.findFirst({ where: { id, OR: [{ estudianteId: usuarioId }, { tutorId: usuarioId }] } });
}

// HU-07: estudiante o tutor cancelan hasta 2 horas antes; queda registrada como cancelada
export async function cancelarAsesoria(formData: FormData): Promise<void> {
  const sesion = await exigirSesion();
  const asesoria = await asesoriaDelUsuario(String(formData.get("id") ?? ""), sesion.sub);

  let aviso = "no-cancelable";
  if (asesoria && (asesoria.estado === "PENDIENTE" || asesoria.estado === "CONFIRMADA")
      && puedeCancelar(deFechaBD(asesoria.fecha), asesoria.horaInicio, new Date())) {
    const { count } = await prisma.asesoria.updateMany({
      where: { id: asesoria.id, estado: { in: ["PENDIENTE", "CONFIRMADA"] } },
      data: { estado: "CANCELADA" },
    });
    if (count === 1) aviso = "cancelada";
  }

  revalidatePath("/mis-asesorias");
  revalidatePath("/tutor/solicitudes");
  redirect(`/mis-asesorias?aviso=${aviso}`);
}

// HU-09: el tutor marca como completada una asesoría confirmada que ya pasó
export async function marcarCompletada(formData: FormData): Promise<void> {
  const { sub: tutorId } = await exigirSesion("TUTOR");
  const asesoria = await prisma.asesoria.findFirst({ where: { id: String(formData.get("id") ?? ""), tutorId, estado: "CONFIRMADA" } });

  let aviso = "sin-cambios";
  if (asesoria && yaPaso(deFechaBD(asesoria.fecha), asesoria.horaInicio, new Date())) {
    await prisma.asesoria.update({ where: { id: asesoria.id }, data: { estado: "COMPLETADA" } });
    aviso = "completada";
  }

  revalidatePath("/mis-asesorias");
  redirect(`/mis-asesorias?aviso=${aviso}`);
}
