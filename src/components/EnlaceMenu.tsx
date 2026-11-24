"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Enlace del menú que se resalta cuando el usuario está en esa sección
export function EnlaceMenu({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  const ruta = usePathname();
  const activo = ruta === href || ruta.startsWith(`${href}/`);
  return (
    <Link href={href} aria-current={activo ? "page" : undefined}
      className={`${className} underline-offset-4 hover:underline ${activo ? "font-semibold underline decoration-emerald-300 decoration-2" : ""}`}>
      {children}
    </Link>
  );
}
