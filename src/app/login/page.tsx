import { FormularioLogin } from "./FormularioLogin";

type Props = { searchParams: Promise<{ siguiente?: string }> };

export default async function Login({ searchParams }: Props) {
  const { siguiente } = await searchParams;
  return (
    <section className="mx-auto max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-xl font-bold text-marca">Iniciar sesión</h1>
      <p className="mb-4 text-sm text-slate-500">Usa tu correo institucional.</p>
      <FormularioLogin destino={siguiente ?? "/mis-asesorias"} />
    </section>
  );
}
