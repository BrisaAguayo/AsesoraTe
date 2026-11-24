import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/sesion-servidor";
import { formatearFecha, nombreModalidad } from "@/lib/formato";
import { aFechaBD, hoyLocal } from "@/lib/agenda";
import { responderSolicitud } from "./actions";

export const dynamic = "force-dynamic";

const avisos: Record<string, { texto: string; ok: boolean }> = {
  confirmada: { texto: "Asesoría confirmada. El estudiante ya ve el nuevo estado.", ok: true },
  rechazada: { texto: "Solicitud rechazada. El horario vuelve a estar disponible.", ok: true },
  "sin-cambios": { texto: "Esa solicitud ya había sido respondida o cancelada.", ok: false },
};

type Props = { searchParams: Promise<{ aviso?: string }> };

export default async function Solicitudes({ searchParams }: Props) {
  const { sub: tutorId } = await exigirSesion("TUTOR");
  const { aviso } = await searchParams;

  const pendientes = await prisma.asesoria.findMany({
    where: { tutorId, estado: "PENDIENTE", fecha: { gte: aFechaBD(hoyLocal(new Date())) } },
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
    include: { materia: true, estudiante: { select: { nombre: true, semestre: true } } },
  });

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-marca">Solicitudes</h1>
        <p className="text-slate-500">Confirma o rechaza las asesorías que te han solicitado.</p>
      </div>

      {aviso && avisos[aviso] && (
        <p role="status" className={`rounded border px-4 py-2 text-sm ${avisos[aviso].ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {avisos[aviso].texto}
        </p>
      )}

      {pendientes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">No tienes solicitudes pendientes.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pendientes.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <div>
                <p className="font-semibold">{a.materia.nombre}</p>
                <p className="text-sm text-slate-500">
                  {a.estudiante.nombre} ({a.estudiante.semestre}.º semestre) · {formatearFecha(a.fecha)} · {a.horaInicio} - {a.horaFin}
                </p>
                <p className="text-sm text-slate-500">{nombreModalidad[a.modalidad]}{a.lugar ? `, ${a.lugar}` : ""}</p>
                <p className="mt-1 text-sm"><span className="font-medium">Tema:</span> {a.tema}</p>
              </div>
              <div className="flex gap-2">
                <form action={responderSolicitud}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="respuesta" value="confirmar" />
                  <button type="submit" className="rounded bg-marca px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">Confirmar</button>
                </form>
                <form action={responderSolicitud}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="respuesta" value="rechazar" />
                  <button type="submit" className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">Rechazar</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
