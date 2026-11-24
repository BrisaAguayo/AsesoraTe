# Registro de versiones

Formato basado en *Keep a Changelog* y versionado semántico.

## [1.0.0] - 2026-11-24

### Agregado
- Base de datos PostgreSQL con migraciones; en producción se usa Supabase.
- Registro con correo institucional y panel según el rol (HU-01).
- Materias del tutor (HU-02) y disponibilidad semanal sin empalmes (HU-03).
- Búsqueda por materia, día y modalidad desde la base de datos (HU-04).
- Agendar asesorías sin empalmes, con transacción serializable (HU-05).
- Confirmar o rechazar solicitudes (HU-06), cancelar hasta 2 horas antes (HU-07) e historial (HU-09).
- El menú resalta la sección actual.
- Pruebas unitarias de validaciones y reglas de la agenda.

### Seguridad
- Inicio de sesión con bcrypt (costo 12), JWT firmado en cookie `httpOnly`, límite de intentos y protección contra redirección abierta.
- Cabeceras de seguridad (HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy).
- Next.js 15.5.29 y versiones corregidas de dependencias con vulnerabilidades.

### Cambiado
- La búsqueda filtra en la consulta SQL en lugar de hacerlo en el código.
- Los horarios usan los campos estructurados del modelo (`diaSemana`, `horaInicio`, `horaFin`).

## [0.1.0] - 2026-10-11

### Agregado
- Estructura inicial del proyecto con Next.js, TypeScript y Tailwind CSS.
- Modelo de datos inicial en Prisma: Usuario, Materia, TutorMateria, Disponibilidad, Asesoria y Evaluacion.
- Datos de ejemplo (`prisma/seed.ts`).
- Pantallas iniciales: inicio, inicio de sesión, búsqueda de asesorías y mis asesorías (con datos de ejemplo).
- Documentación: requerimientos, historias de usuario, backlog, diagramas y bitácora de cambios.
- Plantillas de GitHub para issues (historia de usuario, defecto, solicitud de cambio) y pull requests.
