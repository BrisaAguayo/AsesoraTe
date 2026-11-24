"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Campo, estiloInput } from "@/components/Campo";
import { dias } from "@/lib/formato";
import { guardarBloque, type EstadoBloque } from "./actions";

interface Props {
  bloque?: { id: string; diaSemana: number; horaInicio: string; horaFin: string; modalidad: string; lugar: string | null };
}

export function FormularioBloque({ bloque }: Props) {
  const [estado, accion, enviando] = useActionState<EstadoBloque, FormData>(guardarBloque, {});
  // Si hubo errores se muestran los valores que escribió el tutor, no se borran
  const v = estado.valores ?? {
    diaSemana: String(bloque?.diaSemana ?? 1), horaInicio: bloque?.horaInicio ?? "", horaFin: bloque?.horaFin ?? "",
    modalidad: bloque?.modalidad ?? "PRESENCIAL", lugar: bloque?.lugar ?? "",
  };
  const e = estado.errores ?? {};

  return (
    <form action={accion} key={JSON.stringify(v)} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-marca">{bloque ? "Editar bloque" : "Agregar bloque"}</h2>
      {bloque && <input type="hidden" name="id" value={bloque.id} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo etiqueta="Día" error={e.diaSemana}>
          <select name="diaSemana" defaultValue={v.diaSemana} className={estiloInput}>
            {[1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{dias[d]}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Inicio" error={e.horaInicio}>
          <input type="time" name="horaInicio" required min="07:00" max="21:00" step={900} defaultValue={v.horaInicio} className={estiloInput} />
        </Campo>
        <Campo etiqueta="Fin" error={e.horaFin}>
          <input type="time" name="horaFin" required min="07:00" max="21:00" step={900} defaultValue={v.horaFin} className={estiloInput} />
        </Campo>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo etiqueta="Modalidad" error={e.modalidad}>
          <select name="modalidad" defaultValue={v.modalidad} className={estiloInput}>
            <option value="PRESENCIAL">Presencial</option>
            <option value="VIRTUAL">Virtual</option>
          </select>
        </Campo>
        <div className="sm:col-span-2">
          <Campo etiqueta="Lugar o enlace" error={e.lugar}>
            <input name="lugar" required maxLength={100} placeholder="Edificio J, aula 5 · Google Meet" defaultValue={v.lugar} className={estiloInput} />
          </Campo>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={enviando} className="rounded bg-marca px-5 py-2 font-medium text-white disabled:opacity-60">
          {enviando ? "Guardando…" : bloque ? "Guardar cambios" : "Agregar bloque"}
        </button>
        {bloque && <Link href="/tutor/disponibilidad" className="text-sm text-marca underline">Cancelar edición</Link>}
      </div>
    </form>
  );
}
