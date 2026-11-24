// Guarda el JWT en la cookie de sesión (inicio de sesión y registro)
import { cookies } from "next/headers";
import { COOKIE_SESION, DURACION_SESION_S } from "@/lib/sesion";

export async function guardarCookieSesion(token: string): Promise<void> {
  (await cookies()).set(COOKIE_SESION, token, {
    httpOnly: true,   // JavaScript del navegador no puede leerla (protege contra XSS)
    secure: true,     // solo viaja por HTTPS
    sameSite: "lax",  // no se envía en peticiones de otros sitios (protege contra CSRF)
    path: "/",
    maxAge: DURACION_SESION_S,
  });
}
