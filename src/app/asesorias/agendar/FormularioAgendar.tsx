"use client";

import { useActionState } from "react";
import { agendarAsesoria, type EstadoAgendar } from "./actions";

interface Props {
  disponibilidadId: string;
  materiaId: string;
  fechas: { valor: string; etiqueta: string }[];
}

export function FormularioAgendar({ disponibilidadId, materiaId, fechas }: Props) {
  const [estado, accion, enviando] = useActionState<EstadoAgendar, FormData>(agendarAsesoria, {});
  // Tras un error se conserva la fecha elegida; si ya no está en la lista, se marca la primera
  const elegida = fechas.some((f) => f.valor === estado.fecha) ? estado.fecha : fechas[0]?.valor;

  return (
    <form action={accion} key={`${estado.fecha}|${estado.tema}`} className="flex flex-col gap-4">
      <input type="hidden" name="disponibilidad" value={disponibilidadId} />
      <input type="hidden" name="materia" value={materiaId} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-slate-700">Fecha</legend>
        {fechas.map((f) => (
          <label key={f.valor} className="flex cursor-pointer items-center gap-3 rounded border border-slate-300 bg-white px-3 py-2 text-sm has-[:checked]:border-marca has-[:checked]:bg-marca-claro">
            <input type="radio" name="fecha" value={f.valor} required defaultChecked={f.valor === elegida} />
            <span className="first-letter:uppercase">{f.etiqueta}</span>
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Tema que quieres revisar</span>
        <textarea name="tema" required minLength={5} maxLength={200} rows={3} defaultValue={estado.tema}
          placeholder="Ej. Integración por partes, ejercicios de la unidad 2"
          className="w-full rounded border border-slate-300 bg-white px-3 py-2" />
      </label>
      {estado.error && <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>}
      <button type="submit" disabled={enviando} className="rounded bg-marca py-2 font-medium text-white disabled:opacity-60">
        {enviando ? "Agendando…" : "Confirmar solicitud"}
      </button>
    </form>
  );
}
