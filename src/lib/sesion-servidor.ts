// Lectura de la sesión en páginas y acciones del servidor.
// Va en un archivo aparte de sesion.ts porque usa next/headers, que no existe en el Edge Middleware.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION, verificarToken, type DatosSesion, type Rol } from "@/lib/sesion";

export async function obtenerSesion(): Promise<DatosSesion | null> {
  return verificarToken((await cookies()).get(COOKIE_SESION)?.value);
}

// Segunda verificación en el servidor: no se confía solo en el middleware.
// Si no hay sesión o el rol no corresponde, se manda al inicio de sesión.
export async function exigirSesion(rol?: Rol): Promise<DatosSesion> {
  const sesion = await obtenerSesion();
  if (!sesion || (rol && sesion.rol !== rol)) redirect("/login");
  return sesion;
}
