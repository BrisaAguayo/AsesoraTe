import Link from "next/link";
import { TarjetaAsesoria } from "@/components/TarjetaAsesoria";
import { bloquesDisponibles, materias, MODALIDADES } from "@/lib/datos-ejemplo";
import { filtrarBloques, leerFiltros } from "@/lib/asesorias";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function BuscarAsesorias({ searchParams }: Props) {
  // Los filtros viven en la URL: se aplican en el servidor y el enlace se puede compartir
  const filtros = leerFiltros(await searchParams, materias);
  const resultados = filtrarBloques(bloquesDisponibles, filtros);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-marca">Buscar asesorías</h1>
        <p className="text-slate-500">Filtra por materia y elige un horario disponible.</p>
      </div>

      {/* key: al cambiar los filtros (por ejemplo con "Limpiar") el formulario se vuelve a montar
          y los selectores toman el valor de la URL en lugar de conservar el anterior */}
      <form key={`${filtros.materia ?? ""}|${filtros.modalidad ?? ""}`} method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Materia
          <select name="materia" defaultValue={filtros.materia ?? ""}
            className="rounded border border-slate-300 bg-white px-3 py-2 font-normal">
            <option value="">Todas las materias</option>
            {materias.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Modalidad
          <select name="modalidad" defaultValue={filtros.modalidad ?? ""}
            className="rounded border border-slate-300 bg-white px-3 py-2 font-normal">
            <option value="">Cualquier modalidad</option>
            {MODALIDADES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded bg-marca px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Aplicar filtros
        </button>
        <Link href="/asesorias" className="px-2 py-2 text-sm text-marca underline">Limpiar</Link>
      </form>

      <p className="text-sm text-slate-500" aria-live="polite">
        {resultados.length === 1 ? "1 asesoría encontrada" : `${resultados.length} asesorías encontradas`}
      </p>

      {resultados.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.map((b) => <TarjetaAsesoria key={b.id} bloque={b} />)}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold">No hay asesorías disponibles</p>
          <p className="text-sm text-slate-500">Prueba con otra modalidad o con todas las materias.</p>
        </div>
      )}
    </section>
  );
}
