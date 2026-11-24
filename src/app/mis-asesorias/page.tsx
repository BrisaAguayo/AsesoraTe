import Link from "next/link";
import type { EstadoAsesoria } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/sesion-servidor";
import { cerrarSesion } from "@/app/login/acciones";
import { formatearFecha, nombreEstado, nombreModalidad } from "@/lib/formato";
import { deFechaBD, instanteLocal, puedeCancelar, yaPaso } from "@/lib/agenda";
import { cancelarAsesoria, marcarCompletada } from "./actions";

export const dynamic = "force-dynamic";

// Record con el tipo del estado: si se agrega un estado nuevo, TypeScript obliga a darle color
const colorEstado: Record<EstadoAsesoria, string> = {
  CONFIRMADA: "bg-emerald-100 text-emerald-800",
  PENDIENTE: "bg-amber-100 text-amber-800",
  COMPLETADA: "bg-slate-200 text-slate-700",
  CANCELADA: "bg-red-100 text-red-800",
  RECHAZADA: "bg-red-100 text-red-800",
};

const avisos: Record<string, { texto: string; ok: boolean }> = {
  agendada: { texto: "Solicitud enviada. Aparece como pendiente hasta que el tutor la confirme.", ok: true },
  cancelada: { texto: "Asesoría cancelada. El horario vuelve a estar disponible.", ok: true },
  completada: { texto: "Asesoría marcada como completada.", ok: true },
  "no-cancelable": { texto: "Esa asesoría ya no se puede cancelar: solo se cancela hasta 2 horas antes.", ok: false },
  "sin-cambios": { texto: "No se hicieron cambios.", ok: false },
};

type Props = { searchParams: Promise<{ aviso?: string }> };

export default async function MisAsesorias({ searchParams }: Props) {
  const sesion = await exigirSesion();
  const esTutor = sesion.rol === "TUTOR";
  const { aviso } = await searchParams;
  const ahora = new Date();

  const asesorias = await prisma.asesoria.findMany({
    where: esTutor ? { tutorId: sesion.sub } : { estudianteId: sesion.sub },
    include: { materia: true, tutor: { select: { nombre: true } }, estudiante: { select: { nombre: true } } },
  });

  const conFecha = asesorias.map((a) => ({ ...a, dia: deFechaBD(a.fecha), inicio: instanteLocal(deFechaBD(a.fecha), a.horaInicio) }));
  const esProxima = (a: (typeof conFecha)[number]) =>
    (a.estado === "PENDIENTE" || a.estado === "CONFIRMADA") && !yaPaso(a.dia, a.horaInicio, ahora);
  // Próximas: de la más cercana a la más lejana. Historial (HU-09): de la más reciente a la más antigua
  const proximas = conFecha.filter(esProxima).sort((a, b) => +a.inicio - +b.inicio);
  const historial = conFecha.filter((a) => !esProxima(a)).sort((a, b) => +b.inicio - +a.inicio);

  const Fila = ({ a }: { a: (typeof conFecha)[number] }) => {
    const cancelable = esProxima(a) && puedeCancelar(a.dia, a.horaInicio, ahora);
    const completable = esTutor && a.estado === "CONFIRMADA" && yaPaso(a.dia, a.horaInicio, ahora);
    return (
      <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <p className="font-semibold">{a.materia.nombre}</p>
          <p className="text-sm text-slate-500">
            {esTutor ? a.estudiante.nombre : a.tutor.nombre} · {formatearFecha(a.fecha)} · {a.horaInicio} - {a.horaFin}
          </p>
          <p className="text-sm text-slate-500">{nombreModalidad[a.modalidad]}{a.lugar ? `, ${a.lugar}` : ""} · Tema: {a.tema}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${colorEstado[a.estado]}`}>{nombreEstado[a.estado]}</span>
          {cancelable && (
            <form action={cancelarAsesoria}>
              <input type="hidden" name="id" value={a.id} />
              <button type="submit" className="rounded border border-red-200 px-3 py-1 text-sm text-red-700 hover:bg-red-50">Cancelar</button>
            </form>
          )}
          {esProxima(a) && !cancelable && <span className="text-xs text-slate-400">Ya no se puede cancelar</span>}
          {completable && (
            <form action={marcarCompletada}>
              <input type="hidden" name="id" value={a.id} />
              <button type="submit" className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100">Marcar completada</button>
            </form>
          )}
        </div>
      </li>
    );
  };

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
        <p role="status" className={`rounded border px-4 py-2 text-sm ${avisos[aviso].ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {avisos[aviso].texto}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-slate-700">Próximas</h2>
        {proximas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
            <p>No tienes asesorías próximas.</p>
            {!esTutor && <Link href="/asesorias" className="mt-2 inline-block font-medium text-marca underline">Buscar asesorías</Link>}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">{proximas.map((a) => <Fila key={a.id} a={a} />)}</ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-slate-700">Historial</h2>
        {historial.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay asesorías en tu historial.</p>
        ) : (
          <ul className="flex flex-col gap-3">{historial.map((a) => <Fila key={a.id} a={a} />)}</ul>
        )}
      </div>
    </section>
  );
}
