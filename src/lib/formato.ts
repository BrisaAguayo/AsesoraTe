// Textos que se muestran en la interfaz

export const dias = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const nombreModalidad = { PRESENCIAL: "Presencial", VIRTUAL: "Virtual" } as const;

export const nombreEstado = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  CANCELADA: "Cancelada",
  RECHAZADA: "Rechazada",
  COMPLETADA: "Completada",
} as const;

export function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(fecha);
}

/** Fecha larga para confirmar una asesoría: "lunes, 30 de noviembre de 2026". */
export function formatearFechaLarga(fecha: Date) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "full", timeZone: "UTC" }).format(fecha);
}
