// Edge Middleware: verifica el JWT en el borde antes de mostrar páginas privadas (reporte 10)
// y limita las pantallas del tutor a su rol (RNF-04)
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarToken } from "@/lib/sesion";

export async function middleware(req: NextRequest) {
  const sesion = await verificarToken(req.cookies.get(COOKIE_SESION)?.value);
  const esRutaTutor = req.nextUrl.pathname.startsWith("/tutor");

  if (sesion && (!esRutaTutor || sesion.rol === "TUTOR")) return NextResponse.next();
  if (sesion) return NextResponse.redirect(new URL("/panel", req.url)); // sesión válida, rol sin permiso

  const url = new URL("/login", req.url);
  url.searchParams.set("siguiente", req.nextUrl.pathname + req.nextUrl.search); // conserva, por ejemplo, el horario elegido
  const res = NextResponse.redirect(url);
  res.cookies.delete(COOKIE_SESION); // elimina un token vencido o alterado
  return res;
}

export const config = { matcher: ["/panel/:path*", "/tutor/:path*", "/mis-asesorias/:path*", "/asesorias/agendar"] };
