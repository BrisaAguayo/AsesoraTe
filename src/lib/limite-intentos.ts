// Limita los intentos fallidos de inicio de sesión: 5 fallos en 15 minutos bloquean por 15 minutos.
// En producción el contador vive en Redis en el borde (reporte 10) para compartirse entre instancias.
const MAX_FALLOS = 5;
const VENTANA_MS = 15 * 60 * 1000;
const fallos = new Map<string, { cuenta: number; desde: number }>();

export function estaBloqueado(clave: string): boolean {
  const r = fallos.get(clave);
  if (!r) return false;
  if (Date.now() - r.desde > VENTANA_MS) { fallos.delete(clave); return false; }
  return r.cuenta >= MAX_FALLOS;
}

export function registrarFallo(clave: string): void {
  const r = fallos.get(clave);
  if (!r || Date.now() - r.desde > VENTANA_MS) fallos.set(clave, { cuenta: 1, desde: Date.now() });
  else r.cuenta++;
}

export const limpiarFallos = (clave: string) => fallos.delete(clave);
