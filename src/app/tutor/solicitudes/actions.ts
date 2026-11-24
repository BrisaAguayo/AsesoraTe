"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/sesion-servidor";

// HU-06: el tutor confirma o rechaza una solicitud pendiente que le pertenece
export async function responderSolicitud(formData: FormData): Promise<void> {
  const { sub: tutorId } = await exigirSesion("TUTOR");
  const id = String(formData.get("id") ?? "");
  const valor = formData.get("respuesta");
  if (valor !== "confirmar" && valor !== "rechazar") redirect("/tutor/solicitudes");
  const respuesta = valor === "confirmar" ? "CONFIRMADA" : "RECHAZADA";

  // updateMany con tutorId y estado: no se puede responder la de otro tutor ni una ya respondida
  const { count } = await prisma.asesoria.updateMany({
    where: { id, tutorId, estado: "PENDIENTE" },
    data: { estado: respuesta },
  });

  revalidatePath("/tutor/solicitudes");
  revalidatePath("/mis-asesorias");
  redirect(`/tutor/solicitudes?aviso=${count === 0 ? "sin-cambios" : respuesta === "CONFIRMADA" ? "confirmada" : "rechazada"}`);
}
