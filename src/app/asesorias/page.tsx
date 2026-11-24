import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dias, nombreModalidad } from "@/lib/formato";
import { leerFiltros, MODALIDADES } from "@/lib/asesorias";
import { TarjetaAsesoria, type BloqueDisponible } from "@/components/TarjetaAsesoria";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function BuscarAsesorias({ searchParams }: Props) {
  const materias = await prisma.materia.findMany({ orderBy: { nombre: "asc" } });
  // Los filtros viven en la URL: se validan y se aplican en el servidor, y el enlace se puede compartir
  const filtros = leerFiltros(await searchParams, materias.map((m) => m.id));

  // El filtrado se hace en la consulta SQL, no en el código
  const where: Prisma.DisponibilidadWhereInput = {
    modalidad: filtros.modalidad,
    diaSemana: filtros.dia,
    tutor: { rol: "TUTOR", materiasQueImparte: filtros.materia ? { some: { materiaId: filtros.materia } } : { some: {} } },
  };

  const disponibilidad = await prisma.disponibilidad.findMany({
    where,
    orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
    // RNF-07: solo se consultan nombre, semestre y materias del tutor
    include: { tutor: { select: { nombre: true, semestre: true, materiasQueImparte: { include: { materia: true } } } } },
  });

  // Una tarjeta por cada materia que el tutor asesora en ese horario
  const bloques: BloqueDisponible[] = disponibilidad.flatMap((d) =>
    d.tutor.materiasQueImparte
      .filter((tm) => !filtros.materia || tm.materiaId === filtros.materia)
      .map((tm) => ({
        id: `${d.id}-${tm.materiaId}`,
        disponibilidadId: d.id,
        materiaId: tm.materiaId,
        tutor: d.tutor.nombre,
        semestreTutor: d.tutor.semestre,
        materia: tm.materia.nombre,
        diaSemana: d.diaSemana,
        horaInicio: d.horaInicio,
        horaFin: d.horaFin,
        modalidad: d.modalidad,
        lugar: d.lugar,
      })),
  );

  const estiloFiltro = "rounded border border-slate-300 bg-white px-3 py-2 font-normal";

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-marca">Buscar asesorías</h1>
        <p className="text-slate-500">Filtra por materia, día y modalidad, y elige un horario disponible.</p>
      </div>

      {/* key: al cambiar los filtros (por ejemplo con "Limpiar") el formulario se vuelve a montar
          y los selectores toman el valor de la URL en lugar de conservar el anterior */}
      <form key={`${filtros.materia ?? ""}|${filtros.dia ?? ""}|${filtros.modalidad ?? ""}`} method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Materia
          <select name="materia" defaultValue={filtros.materia ?? ""} className={estiloFiltro}>
            <option value="">Todas las materias</option>
            {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Día
          <select name="dia" defaultValue={filtros.dia ?? ""} className={estiloFiltro}>
            <option value="">Cualquier día</option>
            {[1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{dias[d]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Modalidad
          <select name="modalidad" defaultValue={filtros.modalidad ?? ""} className={estiloFiltro}>
            <option value="">Cualquier modalidad</option>
            {MODALIDADES.map((m) => <option key={m} value={m}>{nombreModalidad[m]}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded bg-marca px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Aplicar filtros
        </button>
        <Link href="/asesorias" className="px-2 py-2 text-sm text-marca underline">Limpiar</Link>
      </form>

      <p className="text-sm text-slate-500" aria-live="polite">
        {bloques.length === 1 ? "1 asesoría encontrada" : `${bloques.length} asesorías encontradas`}
      </p>

      {bloques.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bloques.map((b) => <TarjetaAsesoria key={b.id} bloque={b} />)}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold">No hay asesorías disponibles</p>
          <p className="text-sm text-slate-500">Prueba con otra materia, otro día o cualquier modalidad.</p>
        </div>
      )}
    </section>
  );
}
