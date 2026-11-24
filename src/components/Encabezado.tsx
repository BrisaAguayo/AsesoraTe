import Link from "next/link";
import { obtenerSesion } from "@/lib/sesion-servidor";
import { cerrarSesion } from "@/app/login/acciones";
import { EnlaceMenu } from "@/components/EnlaceMenu";

export async function Encabezado() {
  const sesion = await obtenerSesion();

  return (
    <header className="bg-marca text-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href={sesion ? "/panel" : "/"} className="text-lg font-bold tracking-tight">
          Asesora<span className="text-emerald-300">T</span>
        </Link>
        <div className="flex items-center gap-3 whitespace-nowrap text-sm">
          <EnlaceMenu href="/asesorias">Buscar</EnlaceMenu>
          {sesion ? (
            <>
              <EnlaceMenu href="/mis-asesorias">Mis asesorías</EnlaceMenu>
              <EnlaceMenu href="/panel" className="hidden sm:inline">{sesion.nombre.split(" ")[0]}</EnlaceMenu>
              <form action={cerrarSesion}>
                <button type="submit" className="rounded bg-white/15 px-3 py-1 hover:bg-white/25">Salir</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="rounded bg-white/15 px-3 py-1 hover:bg-white/25">Entrar</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
