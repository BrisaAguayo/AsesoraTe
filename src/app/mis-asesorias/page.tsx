import { cookies } from "next/headers";
import { misAsesorias, type EstadoAsesoria } from "@/lib/datos-ejemplo";
import { COOKIE_SESION, verificarToken } from "@/lib/sesion";
import { cerrarSesion } from "@/app/login/acciones";

// Record con el tipo del estado: si se agrega un estado nuevo, TypeScript obliga a darle color
const colorEstado: Record<EstadoAsesoria, string> = {
  Confirmada: "bg-emerald-100 text-emerald-800",
  Pendiente: "bg-amber-100 text-amber-800",
  Completada: "bg-slate-200 text-slate-700",
};

export default async function MisAsesorias() {
  // Segunda verificación en el servidor: no se confía solo en el middleware
  const sesion = await verificarToken((await cookies()).get(COOKIE_SESION)?.value);
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-marca">Mis asesorías</h1>
          <p className="text-sm text-slate-500">Sesión iniciada como {sesion?.nombre}</p>
        </div>
        <form action={cerrarSesion}>
          <button type="submit" className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100">Cerrar sesión</button>
        </form>
      </div>
      <ul className="flex flex-col gap-3">
        {misAsesorias.map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <p className="font-semibold">{a.materia}</p>
              <p className="text-sm text-slate-500">{a.tutor} · {a.fecha} · {a.horario}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${colorEstado[a.estado]}`}>{a.estado}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
