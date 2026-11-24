"use client";
import { useActionState } from "react";
import { iniciarSesion, type EstadoLogin } from "./acciones";

export function FormularioLogin({ destino }: { destino: string }) {
  const [estado, accion, enviando] = useActionState<EstadoLogin, FormData>(iniciarSesion, {});
  return (
    <form action={accion} className="flex flex-col gap-3">
      <input type="hidden" name="destino" value={destino} />
      <label className="text-sm">
        Correo
        <input type="email" name="correo" required autoComplete="email"
          pattern="[^@\s]+@tectijuana\.edu\.mx"
          title="Usa tu correo institucional que termina en @tectijuana.edu.mx"
          placeholder="l00000000@tectijuana.edu.mx"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
      </label>
      <label className="text-sm">
        Contraseña
        <input type="password" name="contrasena" required minLength={8} maxLength={72} autoComplete="current-password"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
      </label>
      {estado.error && <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>}
      <button type="submit" disabled={enviando} className="rounded bg-marca py-2 font-medium text-white disabled:opacity-60">
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
