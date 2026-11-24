"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { buscarUsuarioPorCorreo } from "@/lib/usuarios";
import { compararContrasena, HASH_RELLENO } from "@/lib/contrasenas";
import { COOKIE_SESION, crearToken } from "@/lib/sesion";
import { guardarCookieSesion } from "@/lib/cookie-sesion";
import { estaBloqueado, limpiarFallos, registrarFallo } from "@/lib/limite-intentos";

// Se regresa el correo para que el formulario no lo borre al mostrar un error
export type EstadoLogin = { error?: string; correo?: string };
const CORREO_INSTITUCIONAL = /^[^@\s]+@tectijuana\.edu\.mx$/i;

export async function iniciarSesion(_prev: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const correo = String(form.get("correo") ?? "").trim().toLowerCase();
  const contrasena = String(form.get("contrasena") ?? "");
  const destino = String(form.get("destino") ?? "/panel");

  // La validación del navegador se puede saltar: se repite en el servidor
  if (!CORREO_INSTITUCIONAL.test(correo)) return { error: "Usa tu correo institucional @tectijuana.edu.mx.", correo };
  if (contrasena.length < 8 || contrasena.length > 72) return { error: "Correo o contraseña incorrectos.", correo };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const clave = `${ip}|${correo}`;
  if (estaBloqueado(clave)) return { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.", correo };

  const usuario = await buscarUsuarioPorCorreo(correo);
  const valida = await compararContrasena(contrasena, usuario?.passwordHash ?? HASH_RELLENO);
  if (!usuario || !valida) {
    registrarFallo(clave);
    return { error: "Correo o contraseña incorrectos.", correo }; // mismo mensaje: no revela si el correo existe
  }

  limpiarFallos(clave);
  const token = await crearToken({ sub: usuario.id, nombre: usuario.nombre, rol: usuario.rol });
  await guardarCookieSesion(token);
  // Solo se permiten rutas internas para evitar redirecciones abiertas a otros sitios
  redirect(destino.startsWith("/") && !destino.startsWith("//") ? destino : "/panel");
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(COOKIE_SESION);
  redirect("/");
}
