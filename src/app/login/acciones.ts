"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { buscarUsuarioPorCorreo } from "@/lib/usuarios";
import { compararContrasena, HASH_RELLENO } from "@/lib/contrasenas";
import { COOKIE_SESION, DURACION_SESION_S, crearToken } from "@/lib/sesion";
import { estaBloqueado, limpiarFallos, registrarFallo } from "@/lib/limite-intentos";

export type EstadoLogin = { error?: string };
const CORREO_INSTITUCIONAL = /^[^@\s]+@tectijuana\.edu\.mx$/i;

export async function iniciarSesion(_prev: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const correo = String(form.get("correo") ?? "").trim().toLowerCase();
  const contrasena = String(form.get("contrasena") ?? "");
  const destino = String(form.get("destino") ?? "/mis-asesorias");

  // La validación del navegador se puede saltar: se repite en el servidor
  if (!CORREO_INSTITUCIONAL.test(correo)) return { error: "Usa tu correo institucional @tectijuana.edu.mx." };
  if (contrasena.length < 8 || contrasena.length > 72) return { error: "Correo o contraseña incorrectos." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const clave = `${ip}|${correo}`;
  if (estaBloqueado(clave)) return { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." };

  const usuario = await buscarUsuarioPorCorreo(correo);
  const valida = await compararContrasena(contrasena, usuario?.passwordHash ?? HASH_RELLENO);
  if (!usuario || !valida) {
    registrarFallo(clave);
    return { error: "Correo o contraseña incorrectos." }; // mismo mensaje: no revela si el correo existe
  }

  limpiarFallos(clave);
  const token = await crearToken({ sub: usuario.id, nombre: usuario.nombre, rol: usuario.rol });
  (await cookies()).set(COOKIE_SESION, token, {
    httpOnly: true,   // JavaScript del navegador no puede leerla (protege contra XSS)
    secure: true,     // solo viaja por HTTPS
    sameSite: "lax",  // no se envía en peticiones de otros sitios (protege contra CSRF)
    path: "/",
    maxAge: DURACION_SESION_S,
  });
  // Solo se permiten rutas internas para evitar redirecciones abiertas a otros sitios
  redirect(destino.startsWith("/") && !destino.startsWith("//") ? destino : "/mis-asesorias");
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(COOKIE_SESION);
  redirect("/login");
}
