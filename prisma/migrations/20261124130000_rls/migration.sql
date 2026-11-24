-- Supabase publica el esquema "public" en su API REST (Data API). La aplicación no la usa:
-- se conecta directo a PostgreSQL con Prisma. Se activa RLS sin políticas para que la API
-- no pueda leer ni modificar ninguna tabla; el dueño de las tablas (la conexión de Prisma) no se ve afectado.
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Materia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TutorMateria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Disponibilidad" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Asesoria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Evaluacion" ENABLE ROW LEVEL SECURITY;
