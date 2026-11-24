// Filtros de la búsqueda de asesorías
export const MODALIDADES = ["PRESENCIAL", "VIRTUAL"] as const;
export type Modalidad = (typeof MODALIDADES)[number];

export interface FiltrosAsesoria {
  materia?: string; // id de la materia
  modalidad?: Modalidad;
  dia?: number; // 1 = lunes ... 6 = sábado
}

// Convierte los parámetros de la URL (?materia=...&modalidad=...&dia=...) en filtros válidos.
// Cualquier valor desconocido se ignora para no romper la búsqueda.
export function leerFiltros(
  params: Record<string, string | string[] | undefined>,
  materiasValidas: readonly string[],
): FiltrosAsesoria {
  const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const materia = texto(params.materia);
  const modalidad = texto(params.modalidad);
  const dia = Number(texto(params.dia));

  return {
    materia: materia && materiasValidas.includes(materia) ? materia : undefined,
    modalidad: MODALIDADES.find((m) => m === modalidad),
    dia: Number.isInteger(dia) && dia >= 1 && dia <= 6 ? dia : undefined,
  };
}
