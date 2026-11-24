// Acceso a usuarios. Mientras la base de datos de Supabase no está conectada se usan datos de ejemplo;
// al conectarla, esta función se reemplaza por prisma.usuario.findUnique({ where: { correo } }).
import type { Rol } from "@/lib/sesion";

interface Usuario { id: string; nombre: string; correo: string; rol: Rol; passwordHash: string }

// Solo se guarda el hash bcrypt de la contraseña, nunca la contraseña
const usuariosEjemplo: Usuario[] = [
  { id: "u-tutora-1", nombre: "Andrea López", correo: "tutora.demo@tectijuana.edu.mx", rol: "TUTOR", passwordHash: "$2b$12$sMGV01qgHdrayefeVU.Dye7GS9NQWMikk4KsjJU/qlOADNyPhwolG" },
  { id: "u-alumno-1", nombre: "Estudiante Demo", correo: "alumno.demo@tectijuana.edu.mx", rol: "ESTUDIANTE", passwordHash: "$2b$12$sMGV01qgHdrayefeVU.Dye7GS9NQWMikk4KsjJU/qlOADNyPhwolG" },
];

export async function buscarUsuarioPorCorreo(correo: string): Promise<Usuario | null> {
  return usuariosEjemplo.find((u) => u.correo === correo.toLowerCase()) ?? null;
}
