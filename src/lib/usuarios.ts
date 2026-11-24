// Acceso a usuarios en la base de datos
import { prisma } from "@/lib/prisma";

export function buscarUsuarioPorCorreo(correo: string) {
  return prisma.usuario.findUnique({
    where: { correo: correo.trim().toLowerCase() },
    select: { id: true, nombre: true, rol: true, passwordHash: true },
  });
}
