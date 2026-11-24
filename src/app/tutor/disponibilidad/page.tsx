import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/sesion-servidor";
import { dias, nombreModalidad } from "@/lib/formato";
import { eliminarBloque } from "./actions";
import { FormularioBloque } from "./FormularioBloque";

export const dynamic = "force-dynamic";

const avisos: Record<string, string> = { nuevo: "Bloque agregado.", editado: "Bloque actualizado.", eliminado: "Bloque eliminado." };

type Props = { searchParams: Promise<{ editar?: string; guardado?: string }> };

export default async function MiDisponibilidad({ searchParams }: Props) {
  const { sub: tutorId } = await exigirSesion("TUTOR");
  const { editar, guardado } = await searchParams;

  const bloques = await prisma.disponibilidad.findMany({
    where: { tutorId },
    orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
  });
  const enEdicion = bloques.find((b) => b.id === editar);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-marca">Mi disponibilidad</h1>
        <p className="text-slate-500">Registra los horarios semanales en los que puedes dar asesorías.</p>
      </div>

      {guardado && avisos[guardado] && (
        <p role="status" className="rounded border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{avisos[guardado]}</p>
      )}

      {bloques.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
          Todavía no tienes horarios. Agrega tu primer bloque.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bloques.map((b) => (
            <li key={b.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 ${b.id === editar ? "border-marca" : "border-slate-200"}`}>
              <div>
                <p className="font-medium">{dias[b.diaSemana]} · {b.horaInicio} - {b.horaFin}</p>
                <p className="text-sm text-slate-500">{nombreModalidad[b.modalidad]}{b.lugar ? `, ${b.lugar}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/tutor/disponibilidad?editar=${b.id}`} className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100">Editar</Link>
                <form action={eliminarBloque}>
                  <input type="hidden" name="id" value={b.id} />
                  <button type="submit" className="rounded border border-red-200 px-3 py-1 text-sm text-red-700 hover:bg-red-50">Eliminar</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <FormularioBloque key={enEdicion?.id ?? "nuevo"} bloque={enEdicion} />
    </section>
  );
}
