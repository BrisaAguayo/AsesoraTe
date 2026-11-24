import Link from "next/link";
import type { EstadoAsesoria } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/sesion-servidor";
import { cerrarSesion } from "@/app/login/acciones";
import { formatearFecha, nombreEstado } from "@/lib/formato";

export const dynamic = "force-dynamic";

// Record con el tipo del estado: si se agrega un estado nuevo, TypeScript obliga a darle color
const colorEstado: Record<EstadoAsesoria, string> = {
  CONFIRMADA: "bg-emerald-100 text-emerald-800",
  PENDIENTE: "bg-amber-100 text-amber-800",
  COMPLETADA: "bg-slate-200 text-slate-700",
  CANCELADA: "bg-red-100 text-red-800",
  RECHAZADA: "bg-red-100 text-red-800",
};

type Props = { searchParams: Promise<{ aviso?: string }> };

const avisos: Record<string, string> = {
  agendada: "Solicitud enviada. Aparece como pendiente hasta que el tutor la confirme.",
};

export default async function MisAsesorias({ searchParams }: Props) {
  const sesion = await exigirSesion();
  const esTutor = sesion.rol === "TUTOR";
  const { aviso } = await searchParams;
  const asesorias = await prisma.asesoria.findMany({
    where: esTutor ? { tutorId: sesion.sub } : { estudianteId: sesion.sub },
    orderBy: { fecha: "desc" },
    include: { materia: true, tutor: { select: { nombre: true } }, estudiante: { select: { nombre: true } } },
  });

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-marca">Mis asesorías</h1>
          <p className="text-sm text-slate-500">Sesión iniciada como {sesion.nombre}</p>
        </div>
        <form action={cerrarSesion}>
          <button type="submit" className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100">Cerrar sesión</button>
        </form>
      </div>
      {aviso && avisos[aviso] && (
        <p role="status" className="rounded border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{avisos[aviso]}</p>
      )}
      {asesorias.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
          <p>Todavía no tienes asesorías.</p>
          {!esTutor && <Link href="/asesorias" className="mt-2 inline-block font-medium text-marca underline">Buscar asesorías</Link>}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {asesorias.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <div>
                <p className="font-semibold">{a.materia.nombre}</p>
                <p className="text-sm text-slate-500">
                  {esTutor ? a.estudiante.nombre : a.tutor.nombre} · {formatearFecha(a.fecha)} · {a.horaInicio} - {a.horaFin}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${colorEstado[a.estado]}`}>{nombreEstado[a.estado]}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
