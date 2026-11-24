import { test } from "node:test";
import assert from "node:assert/strict";
import {
  diaDeSemana, instanteLocal, proximasFechas, puedeCancelar, seEmpalman, validarBloque, validarTema,
} from "./agenda";

test("detecta horarios que se empalman", () => {
  assert.equal(seEmpalman({ horaInicio: "13:00", horaFin: "14:00" }, { horaInicio: "13:30", horaFin: "14:30" }), true);
  assert.equal(seEmpalman({ horaInicio: "13:00", horaFin: "14:00" }, { horaInicio: "14:00", horaFin: "15:00" }), false);
  assert.equal(seEmpalman({ horaInicio: "10:00", horaFin: "12:00" }, { horaInicio: "10:30", horaFin: "11:00" }), true);
});

test("valida un bloque de disponibilidad", () => {
  const base = { diaSemana: "1", horaInicio: "13:00", horaFin: "14:00", modalidad: "PRESENCIAL", lugar: "Edificio J, aula 5" };
  assert.equal(validarBloque(base).ok, true);
  assert.equal(validarBloque({ ...base, horaFin: "12:00" }).ok, false);
  assert.equal(validarBloque({ ...base, horaInicio: "06:00", horaFin: "07:00" }).ok, false);
  assert.equal(validarBloque({ ...base, horaFin: "17:30" }).ok, false); // más de 3 horas
  assert.equal(validarBloque({ ...base, diaSemana: "7" }).ok, false);
  assert.equal(validarBloque({ ...base, modalidad: "OTRA" }).ok, false);
  assert.equal(validarBloque({ ...base, lugar: "" }).ok, false);
});

test("rechaza un bloque que se empalma con otro del mismo día", () => {
  const nuevo = { diaSemana: "1", horaInicio: "13:30", horaFin: "14:30", modalidad: "VIRTUAL", lugar: "Google Meet" };
  assert.equal(validarBloque(nuevo, [{ diaSemana: 1, horaInicio: "13:00", horaFin: "14:00" }]).ok, false);
  assert.equal(validarBloque(nuevo, [{ diaSemana: 2, horaInicio: "13:00", horaFin: "14:00" }]).ok, true);
});

test("calcula el día de la semana", () => {
  assert.equal(diaDeSemana("2026-11-30"), 1); // lunes
  assert.equal(diaDeSemana("2026-12-05"), 6); // sábado
  assert.equal(diaDeSemana("2026-11-29"), 7); // domingo
});

test("convierte la hora de Tijuana al instante correcto (UTC−8 en invierno, UTC−7 en verano)", () => {
  assert.equal(instanteLocal("2026-11-30", "13:00").toISOString(), "2026-11-30T21:00:00.000Z");
  assert.equal(instanteLocal("2026-07-06", "13:00").toISOString(), "2026-07-06T20:00:00.000Z");
});

test("lista las próximas fechas de un bloque semanal", () => {
  const martes = new Date("2026-11-24T18:00:00Z"); // martes 24 nov, 10:00 en Tijuana
  assert.deepEqual(proximasFechas(1, "13:00", martes), ["2026-11-30", "2026-12-07", "2026-12-14", "2026-12-21"]);
  // Hoy a las 16:00 faltan 6 horas: sí aparece hoy
  assert.equal(proximasFechas(2, "16:00", martes)[0], "2026-11-24");
  // Hoy a las 11:00 falta 1 hora: ya no se puede agendar hoy
  assert.equal(proximasFechas(2, "11:00", martes)[0], "2026-12-01");
});

test("solo se cancela hasta 2 horas antes", () => {
  const ahora = new Date("2026-11-30T18:00:00Z"); // 10:00 en Tijuana
  assert.equal(puedeCancelar("2026-11-30", "13:00", ahora), true);
  assert.equal(puedeCancelar("2026-11-30", "11:30", ahora), false);
});

test("valida el tema de la asesoría", () => {
  assert.equal(validarTema("Integración por partes"), null);
  assert.notEqual(validarTema("abc"), null);
  assert.notEqual(validarTema("x".repeat(201)), null);
});
