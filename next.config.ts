import type { NextConfig } from "next";

const esDesarrollo = process.env.NODE_ENV === "development";

// Política de seguridad de contenido: solo se cargan recursos del propio sitio
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${esDesarrollo ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const encabezadosSeguridad = [
  // HTTPS obligatorio por 2 años, incluidos los subdominios
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // no revela que el servidor usa Next.js
  // El cliente de Prisma lee su compilador de consultas (.wasm) con fs en tiempo de ejecución;
  // el rastreo de archivos de Next.js no lo detecta, así que se incluye explícitamente en las funciones de Vercel
  outputFileTracingIncludes: { "/**": ["./node_modules/.prisma/client/*.wasm"] },
  async headers() {
    return [{ source: "/:path*", headers: encabezadosSeguridad }];
  },
};

export default nextConfig;
