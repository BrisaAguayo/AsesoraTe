# AsesoraT

Aplicación web para consultar y agendar asesorías académicas entre estudiantes del Instituto Tecnológico de Tijuana. Los alumnos con dificultades en una materia encuentran a un tutor de semestres avanzados, ven su disponibilidad y reservan un horario sin depender de grupos de WhatsApp o carteles.

> Proyecto integrador: Temas Avanzados de Software en la Nube, semestre Ago-Dic 2026.
> Equipo: Rodrigo Andrés Rivera García (Product Owner), Brisa Julianna Aguayo Virgen (Scrum Master y QA), José Juárez Castelán (Developer).

**Producción:** https://asesora-te.vercel.app

## Estado actual

**Versión 1.0.0.** Funciona el flujo completo: registro, búsqueda, agendado sin empalmes, confirmación del tutor, cancelación e historial, con los datos en PostgreSQL (Supabase).

| Historia de usuario | Estado |
|---|---|
| HU-01 Registro e inicio de sesión con correo institucional | ✅ Lista |
| HU-02 El tutor elige las materias que asesora | ✅ Lista |
| HU-03 El tutor registra, edita y elimina su disponibilidad | ✅ Lista |
| HU-04 Búsqueda por materia, día y modalidad | ✅ Lista |
| HU-05 Agendar una asesoría sin empalmes | ✅ Lista |
| HU-06 El tutor confirma o rechaza solicitudes | ✅ Lista |
| HU-07 Cancelar hasta 2 horas antes | ✅ Lista |
| HU-09 Historial de asesorías | ✅ Lista |
| HU-08 Avisos por correo | Versión 1.1 |
| HU-10 Calificar la asesoría | Versión 1.1 |
| HU-11 Reporte de horas para coordinación | Versión 1.1 |

## Tecnologías

- **Next.js 15** (App Router, Server Actions y Edge Middleware) + **React 19** + **TypeScript**
- **Tailwind CSS** para estilos
- **PostgreSQL en Supabase** + **Prisma ORM** con el adaptador `pg` (sin motor binario)
- **Autenticación propia:** contraseñas con **bcrypt** (costo 12) y sesión con **JWT** firmado (`jose`, HS256) en una cookie `httpOnly`, `secure` y `sameSite=lax`
- **Vercel** para el despliegue (frontend y backend) y **Supabase** para la base de datos

## Seguridad

- Validación de todos los datos en el servidor, aunque el navegador ya los valide.
- Límite de 5 intentos fallidos de inicio de sesión en 15 minutos.
- Rutas privadas protegidas en el Edge Middleware y verificadas otra vez en cada página.
- Cabeceras HSTS, CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy` y `Permissions-Policy`.
- Los secretos (`DATABASE_URL`, `JWT_SECRET`) solo viven en variables de entorno.

## Estructura de carpetas

```
asesorate/
├── docs/                    # Requerimientos, historias de usuario, backlog y diagramas
├── prisma/
│   ├── schema.prisma        # Modelo de datos
│   ├── migrations/          # Migraciones de la base de datos
│   └── seed.ts              # Datos de prueba
├── src/
│   ├── app/                 # Rutas (App Router) y Server Actions
│   ├── components/          # Componentes reutilizables
│   ├── lib/                 # Reglas de negocio, sesión, validaciones y pruebas unitarias
│   └── middleware.ts        # Protección de rutas en el borde
└── CHANGELOG.md
```

## Cómo correrlo

```bash
npm install
cp .env.example .env         # DATABASE_URL de tu PostgreSQL local y JWT_SECRET
npx prisma migrate deploy    # crea las tablas
npm run db:seed              # materias, tutores y usuarios de prueba
npm run dev
```

Abrir http://localhost:3000. Pruebas unitarias: `npm test`.

### Cuentas de prueba

Todas usan la contraseña `Tutorias2026!`.

| Rol | Correo |
|---|---|
| Estudiante | `alumno.demo@tectijuana.edu.mx` |
| Tutora | `tutora.demo@tectijuana.edu.mx` |
| Coordinación | `coordinacion.demo@tectijuana.edu.mx` |

## Flujo de trabajo

Ver [CONTRIBUTING.md](CONTRIBUTING.md): commits con formato *Conventional Commits*, pull request hacia `main` y registro de cambios en [docs/bitacora-cambios.md](docs/bitacora-cambios.md).
