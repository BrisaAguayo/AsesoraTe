import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/sesion-servidor";
import { dias, formatearFechaLarga, nombreModalidad } from "@/lib/formato";
import { aFechaBD, deFechaBD, proximasFechas, seEmpalman } from "@/lib/agenda";
import { FormularioAgendar } from "./FormularioAgendar";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ bloque?: string; materia?: string }> };

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <section className="mx-auto flex max-w-lg flex-col gap-3 rounded-lg border border-slate-200 bg-white p-6 text-center">
      <h1 className="text-xl font-bold text-marca">{titulo}</h1>
      <p className="text-slate-500">{texto}</p>
      <Link href="/asesorias" className="font-medium text-marca underline">Volver a la búsqueda</Link>
    </section>
  );
}

export default async function Agendar({ searchParams }: Props) {
  const sesion = await exigirSesion();
  if (sesion.rol !== "ESTUDIANTE") {
    return <Aviso titulo="Solo para estudiantes" texto="Las asesorías las agendan los estudiantes desde su cuenta." />;
  }

  const { bloque: disponibilidadId = "", materia: materiaId = "" } = await searchParams;
  const [bloque, materia] = await Promise.all([
    prisma.disponibilidad.findFirst({
      where: { id: disponibilidadId, tutor: { rol: "TUTOR", materiasQueImparte: { some: { materiaId } } } },
      include: { tutor: { select: { nombre: true, semestre: true } } },
    }),
    prisma.materia.findUnique({ where: { id: materiaId } }),
  ]);
  if (!bloque || !materia) {
    return <Aviso titulo="Horario no disponible" texto="Ese horario ya no existe o el tutor dejó de asesorar esa materia." />;
  }

  // Fechas de las próximas semanas en que cae el bloque, sin las que ya están ocupadas (HU-05)
  const candidatas = proximasFechas(bloque.diaSemana, bloque.horaInicio, new Date());
  const ocupadas = await prisma.asesoria.findMany({
    where: {
      fecha: { in: candidatas.map(aFechaBD) },
      estado: { in: ["PENDIENTE", "CONFIRMADA", "COMPLETADA"] },
      OR: [{ tutorId: bloque.tutorId }, { estudianteId: sesion.sub }],
    },
    select: { fecha: true, horaInicio: true, horaFin: true },
  });
  const libres = candidatas.filter((f) => !ocupadas.some((a) => deFechaBD(a.fecha) === f && seEmpalman(a, bloque)));

  return (
    <section className="mx-auto flex max-w-lg flex-col gap-5">
      <div>
        <Link href="/asesorias" className="text-sm text-marca underline">← Volver a la búsqueda</Link>
        <h1 className="mt-2 text-2xl font-bold text-marca">Agendar asesoría</h1>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <span className="text-xs font-semibold uppercase text-marca-acento">{materia.nombre}</span>
        <p className="font-semibold">{bloque.tutor.nombre}</p>
        <p className="text-sm text-slate-500">Tutor de {bloque.tutor.semestre}.º semestre</p>
        <p className="mt-1 text-sm">{dias[bloque.diaSemana]} · {bloque.horaInicio} - {bloque.horaFin}</p>
        <p className="text-sm text-slate-500">{nombreModalidad[bloque.modalidad]}{bloque.lugar ? `, ${bloque.lugar}` : ""}</p>
      </div>
      {libres.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
          Este horario está ocupado las próximas semanas. Elige otro tutor u horario.
        </p>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <FormularioAgendar
            disponibilidadId={bloque.id}
            materiaId={materia.id}
            fechas={libres.map((f) => ({ valor: f, etiqueta: formatearFechaLarga(aFechaBD(f)) }))}
          />
          <p className="mt-3 text-xs text-slate-500">La solicitud queda pendiente hasta que el tutor la confirme. Puedes cancelarla hasta 2 horas antes.</p>
        </div>
      )}
    </section>
  );
}
