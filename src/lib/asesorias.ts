import type { BloqueDisponible, Modalidad } from "@/lib/datos-ejemplo";
import { MODALIDADES } from "@/lib/datos-ejemplo";

export interface FiltrosAsesoria {
  materia?: string;
  modalidad?: Modalidad;
}

// Convierte los parámetros de la URL (?materia=...&modalidad=...) en filtros válidos.
// Cualquier valor desconocido se ignora para no romper la búsqueda.
export function leerFiltros(
  params: Record<string, string | string[] | undefined>,
  materiasValidas: readonly string[],
): FiltrosAsesoria {
  const materia = typeof params.materia === "string" ? params.materia : undefined;
  const modalidad = typeof params.modalidad === "string" ? params.modalidad : undefined;

  return {
    materia: materia && materiasValidas.includes(materia) ? materia : undefined,
    modalidad: MODALIDADES.find((m) => m === modalidad),
  };
}

// Regresa solo los bloques que cumplen todos los filtros indicados.
export function filtrarBloques(
  bloques: readonly BloqueDisponible[],
  { materia, modalidad }: FiltrosAsesoria,
): BloqueDisponible[] {
  return bloques.filter(
    (b) => (!materia || b.materia === materia) && (!modalidad || b.modalidad === modalidad),
  );
}
