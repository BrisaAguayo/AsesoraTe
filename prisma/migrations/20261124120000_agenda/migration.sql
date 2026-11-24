-- Agenda de asesorías (HU-05, HU-06, HU-07)

-- AlterEnum: el tutor puede rechazar una solicitud
ALTER TYPE "EstadoAsesoria" ADD VALUE 'RECHAZADA';

-- El índice único anterior impedía volver a agendar un horario cancelado
DROP INDEX "Asesoria_tutorId_fecha_horaInicio_key";

-- CreateIndex
CREATE INDEX "Asesoria_tutorId_fecha_idx" ON "Asesoria"("tutorId", "fecha");

-- CreateIndex
CREATE INDEX "Asesoria_estudianteId_fecha_idx" ON "Asesoria"("estudianteId", "fecha");

-- RF-06: sin empalmes entre asesorías activas (las canceladas y rechazadas liberan el horario)
CREATE UNIQUE INDEX "Asesoria_tutor_horario_activo_key" ON "Asesoria"("tutorId", "fecha", "horaInicio")
  WHERE "estado" IN ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA');

CREATE UNIQUE INDEX "Asesoria_estudiante_horario_activo_key" ON "Asesoria"("estudianteId", "fecha", "horaInicio")
  WHERE "estado" IN ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA');
