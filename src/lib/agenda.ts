// Reglas de la agenda: horarios, empalmes, fechas y cancelación (HU-03, HU-05, HU-07).
// Son funciones puras para poder probarlas sin base de datos.

export const ZONA_HORARIA = "America/Tijuana";
export const HORAS_MINIMAS_CANCELAR = 2; // RF-07: se cancela hasta 2 horas antes
export const HORAS_MINIMAS_AGENDAR = 2; // se agenda con la misma anticipación
export const SEMANAS_A_MOSTRAR = 4;

export interface Intervalo { horaInicio: string; horaFin: string }

/** Hora en formato 24 h "HH:MM". */
export function esHora(hora: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
}

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** Dos horarios se empalman si uno empieza antes de que termine el otro. */
export function seEmpalman(a: Intervalo, b: Intervalo): boolean {
  return aMinutos(a.horaInicio) < aMinutos(b.horaFin) && aMinutos(b.horaInicio) < aMinutos(a.horaFin);
}

// ---------- Bloques de disponibilidad del tutor (HU-03) ----------

export interface DatosBloque {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  modalidad: "PRESENCIAL" | "VIRTUAL";
  lugar: string;
}

export type ResultadoBloque =
  | { ok: true; datos: DatosBloque }
  | { ok: false; errores: Partial<Record<keyof DatosBloque, string>> };

// "otros" son los demás bloques del tutor: el nuevo no puede empalmarse con ninguno del mismo día
export function validarBloque(entrada: Record<string, unknown>, otros: (Intervalo & { diaSemana: number })[] = []): ResultadoBloque {
  const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const diaSemana = Number(entrada.diaSemana);
  const horaInicio = texto(entrada.horaInicio);
  const horaFin = texto(entrada.horaFin);
  const modalidad = texto(entrada.modalidad);
  const lugar = texto(entrada.lugar);
  const errores: Partial<Record<keyof DatosBloque, string>> = {};

  if (!Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 6) errores.diaSemana = "Elige un día de lunes a sábado.";
  if (!esHora(horaInicio)) errores.horaInicio = "Escribe la hora de inicio.";
  if (!esHora(horaFin)) errores.horaFin = "Escribe la hora de fin.";
  if (esHora(horaInicio) && esHora(horaFin)) {
    const duracion = aMinutos(horaFin) - aMinutos(horaInicio);
    if (aMinutos(horaInicio) < aMinutos("07:00") || aMinutos(horaFin) > aMinutos("21:00")) {
      errores.horaInicio = "El horario debe estar entre 07:00 y 21:00.";
    } else if (duracion < 30) {
      errores.horaFin = "La hora de fin debe ser al menos 30 minutos después del inicio.";
    } else if (duracion > 180) {
      errores.horaFin = "Un bloque dura como máximo 3 horas.";
    }
  }
  if (modalidad !== "PRESENCIAL" && modalidad !== "VIRTUAL") errores.modalidad = "Elige la modalidad.";
  if (lugar.length < 3 || lugar.length > 100) errores.lugar = "Indica el aula o el enlace de la videollamada.";

  if (Object.keys(errores).length === 0) {
    const nuevo = { horaInicio, horaFin };
    const choca = otros.some((o) => o.diaSemana === diaSemana && seEmpalman(o, nuevo));
    if (choca) errores.horaInicio = "Este horario se empalma con otro de tus bloques ese día.";
  }

  if (Object.keys(errores).length > 0) return { ok: false, errores };
  return { ok: true, datos: { diaSemana, horaInicio, horaFin, modalidad: modalidad as DatosBloque["modalidad"], lugar } };
}

// ---------- Fechas en la zona horaria de Tijuana ----------

/** Fecha "AAAA-MM-DD" ↔ Date a medianoche UTC (así se guarda en la columna @db.Date). */
export const aFechaBD = (fecha: string) => new Date(`${fecha}T00:00:00Z`);
export const deFechaBD = (fecha: Date) => fecha.toISOString().slice(0, 10);

/** Fecha de hoy en Tijuana, en formato "AAAA-MM-DD". */
export function hoyLocal(ahora: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA, year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
}

// Diferencia en minutos entre la hora de Tijuana y UTC en un instante (−480 o −420 con horario de verano)
function desfaseMinutos(instante: Date): number {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: ZONA_HORARIA, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(instante).map((p) => [p.type, p.value]),
  );
  const local = Date.UTC(+partes.year, +partes.month - 1, +partes.day, +partes.hour, +partes.minute);
  return Math.round((local - instante.getTime()) / 60000);
}

/** Instante real en que empieza una asesoría del día y la hora de Tijuana indicados. */
export function instanteLocal(fecha: string, hora: string): Date {
  const [a, m, d] = fecha.split("-").map(Number);
  const comoUTC = Date.UTC(a, m - 1, d, ...(hora.split(":").map(Number) as [number, number]));
  const primera = comoUTC - desfaseMinutos(new Date(comoUTC)) * 60000;
  return new Date(comoUTC - desfaseMinutos(new Date(primera)) * 60000);
}

/** Día de la semana de una fecha: 1 = lunes ... 7 = domingo. */
export function diaDeSemana(fecha: string): number {
  const d = aFechaBD(fecha).getUTCDay();
  return d === 0 ? 7 : d;
}

function sumarDias(fecha: string, dias: number): string {
  const d = aFechaBD(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return deFechaBD(d);
}

/**
 * Próximas fechas en que cae un bloque semanal y que todavía se pueden agendar
 * (empiezan al menos HORAS_MINIMAS_AGENDAR horas después de ahora).
 */
export function proximasFechas(diaSemana: number, horaInicio: string, ahora: Date, semanas = SEMANAS_A_MOSTRAR): string[] {
  const hoy = hoyLocal(ahora);
  const primera = sumarDias(hoy, (diaSemana - diaDeSemana(hoy) + 7) % 7);
  const fechas: string[] = [];
  for (let i = 0; fechas.length < semanas && i <= semanas; i++) {
    const fecha = sumarDias(primera, i * 7);
    if (sePuedeAgendar(fecha, horaInicio, ahora)) fechas.push(fecha);
  }
  return fechas;
}

const faltanHoras = (fecha: string, hora: string, ahora: Date) =>
  (instanteLocal(fecha, hora).getTime() - ahora.getTime()) / 3_600_000;

export const sePuedeAgendar = (fecha: string, hora: string, ahora: Date) =>
  faltanHoras(fecha, hora, ahora) >= HORAS_MINIMAS_AGENDAR;

/** RF-07: estudiante y tutor cancelan hasta 2 horas antes del inicio. */
export const puedeCancelar = (fecha: string, hora: string, ahora: Date) =>
  faltanHoras(fecha, hora, ahora) >= HORAS_MINIMAS_CANCELAR;

/** La asesoría ya empezó o terminó. */
export const yaPaso = (fecha: string, hora: string, ahora: Date) => faltanHoras(fecha, hora, ahora) <= 0;

/** Tema de la asesoría (HU-05). */
export function validarTema(tema: string): string | null {
  const t = tema.trim();
  if (t.length < 5) return "Escribe el tema que quieres revisar (mínimo 5 caracteres).";
  if (t.length > 200) return "El tema debe tener como máximo 200 caracteres.";
  return null;
}
