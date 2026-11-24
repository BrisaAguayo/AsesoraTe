// Sesiones con JWT firmados (HS256). Solo usa la librería jose, por lo que funciona
// tanto en el servidor como en el Edge Middleware.
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_SESION = "asesorat_sesion";
export const DURACION_SESION_S = 60 * 60 * 8; // 8 horas
const EMISOR = "asesorat";
const AUDIENCIA = "asesorat-web";

export type Rol = "ESTUDIANTE" | "TUTOR" | "COORDINADOR";
export interface DatosSesion { sub: string; nombre: string; rol: Rol }

// El secreto vive en una variable de entorno; si falta o es corto, la app no arranca la sesión
function secreto(): Uint8Array {
  const valor = process.env.JWT_SECRET;
  if (!valor || valor.length < 32) {
    throw new Error("JWT_SECRET no está definido o tiene menos de 32 caracteres");
  }
  return new TextEncoder().encode(valor);
}

export async function crearToken(datos: DatosSesion): Promise<string> {
  return new SignJWT({ nombre: datos.nombre, rol: datos.rol })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(datos.sub)
    .setIssuer(EMISOR)
    .setAudience(AUDIENCIA)
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION_S}s`)
    .sign(secreto());
}

// Regresa los datos si la firma, el emisor, la audiencia y la expiración son válidos; si no, null
export async function verificarToken(token: string | undefined): Promise<DatosSesion | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secreto(), { issuer: EMISOR, audience: AUDIENCIA, algorithms: ["HS256"] });
    return { sub: String(payload.sub), nombre: String(payload.nombre), rol: payload.rol as Rol };
  } catch {
    return null;
  }
}
