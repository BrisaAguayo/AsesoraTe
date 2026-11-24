// Edge Middleware: verifica el JWT en el borde antes de mostrar páginas privadas (reporte 10)
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarToken } from "@/lib/sesion";

export async function middleware(req: NextRequest) {
  const sesion = await verificarToken(req.cookies.get(COOKIE_SESION)?.value);
  if (sesion) return NextResponse.next();

  const url = new URL("/login", req.url);
  url.searchParams.set("siguiente", req.nextUrl.pathname);
  const res = NextResponse.redirect(url);
  res.cookies.delete(COOKIE_SESION); // elimina un token vencido o alterado
  return res;
}

export const config = { matcher: ["/mis-asesorias/:path*"] };
