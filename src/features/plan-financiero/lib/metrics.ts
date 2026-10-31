import type { Escenario, ModeloFinanciero, Periodo, PlanKey, RubroKey } from "./types";
import { PLANES, RUBROS } from "./types";

/**
 * The board's measures. Every figure is derived here from the monthly series, so the
 * board recalculates — a different discount rate, scenario or period — instead of
 * reading results frozen in the workbook. Each formula follows the workbook's own
 * (sheet «Flujos Fondos»), so with the same inputs both give the same numbers.
 */

export const HORIZONTE = 36;

/** Month indices a period covers. The whole horizon includes month 0 (the investment). */
export function mesesDelPeriodo(periodo: Periodo): number[] {
  if (periodo === "todo") return Array.from({ length: HORIZONTE + 1 }, (_, i) => i);
  const first = 1 + (periodo - 2027) * 12;
  return Array.from({ length: 12 }, (_, i) => first + i);
}

/** The last month of a period: where stock measures (accounts, MRR) are read. */
export function cierreDelPeriodo(periodo: Periodo): number {
  return periodo === "todo" ? HORIZONTE : 12 * (periodo - 2026);
}

export function anioDelMes(t: number): number {
  return t === 0 ? 2026 : 2027 + Math.floor((t - 1) / 12);
}

const sumAt = (series: number[][], t: number) =>
  series.reduce((acc, s) => acc + (s[t] ?? 0), 0);

export function planesSeleccionados(plan: PlanKey | "todos"): PlanKey[] {
  return plan === "todos" ? PLANES.map((p) => p.key) : [plan];
}

export function clientesEn(e: Escenario, t: number, plan: PlanKey | "todos" = "todos"): number {
  return planesSeleccionados(plan).reduce((acc, k) => acc + (e.clientes[k][t] ?? 0), 0);
}

export function ingresosEn(e: Escenario, t: number, plan: PlanKey | "todos" = "todos"): number {
  return planesSeleccionados(plan).reduce((acc, k) => acc + (e.ingresos[k][t] ?? 0), 0);
}

export function egresosEn(e: Escenario, t: number): number {
  return sumAt(RUBROS.map((r) => e.egresos[r.key]), t);
}

/** Net cash flow per month, ARS: collections − budget lines − investment + recoveries. */
export function flujoNetoArs(e: Escenario): number[] {
  return e.cobranzas.map(
    (cob, t) => cob - egresosEn(e, t) - (e.inversion[t] ?? 0) + (e.recupero[t] ?? 0),
  );
}

export function flujoNetoUsd(e: Escenario, tipoCambio: number): number[] {
  return flujoNetoArs(e).map((v) => v / tipoCambio);
}

export function acumulado(values: number[]): number[] {
  let running = 0;
  return values.map((v) => (running += v));
}

/** Monthly flows discounted at an annual USD rate: factor (1 + TD)^(−t/12), as the workbook. */
export function descontado(flows: number[], tasaAnual: number): number[] {
  return flows.map((v, t) => v / Math.pow(1 + tasaAnual, t / 12));
}

export function van(flows: number[], tasaAnual: number): number {
  return descontado(flows, tasaAnual).reduce((a, b) => a + b, 0);
}

/**
 * Monthly IRR the way the workbook's IRR() finds it: Newton's method from a 1 % guess
 * (then −2 %), and if that fails, bisection on the sign change closest to the guess. The
 * last month carries the year's income tax, so a flow can turn negative twice — starting
 * near the guess picks the economically meaningful root, as Excel does.
 */
export function tirMensual(flows: number[]): number | null {
  const npv = (r: number) => flows.reduce((acc, v, t) => acc + v / Math.pow(1 + r, t), 0);
  const dnpv = (r: number) => flows.reduce((acc, v, t) => acc - (t * v) / Math.pow(1 + r, t + 1), 0);
  for (const guess of [0.01, -0.02]) {
    let r = guess;
    for (let i = 0; i < 100; i++) {
      const f = npv(r);
      const d = dnpv(r);
      if (!Number.isFinite(f) || !Number.isFinite(d) || d === 0) break;
      const next = r - f / d;
      if (next <= -0.999) break;
      if (Math.abs(next - r) < 1e-12) return next;
      r = next;
    }
    if (r > -0.999 && Math.abs(npv(r)) < 1e-6) return r;
  }
  // Fallback: scan outward from the guess for a sign change, then bisect it.
  for (let k = 1; k <= 400; k++) {
    for (const [a, b] of [
      [0.01 + (k - 1) * 0.005, 0.01 + k * 0.005],
      [0.01 - k * 0.005, 0.01 - (k - 1) * 0.005],
    ]) {
      if (a <= -0.99) continue;
      let lo = a;
      let hi = b;
      let fLo = npv(lo);
      if (fLo * npv(hi) > 0) continue;
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        const fMid = npv(mid);
        if (fLo * fMid <= 0) hi = mid;
        else {
          lo = mid;
          fLo = fMid;
        }
      }
      return (lo + hi) / 2;
    }
  }
  return null;
}

export const anualizar = (mensual: number) => Math.pow(1 + mensual, 12) - 1;

/**
 * Payback in months from month 0, interpolated inside the month the cumulative flow turns
 * positive — the workbook's formula, so a fraction of a month becomes days.
 */
export function repagoMeses(flows: number[]): number | null {
  const cum = acumulado(flows);
  const negativos = cum.filter((v) => v < 0).length;
  if (negativos >= cum.length) return null;
  if (negativos === 0) return 0;
  return negativos - 1 + -cum[negativos - 1] / flows[negativos];
}

/** 22.66 → "1 año, 10 meses y 20 días": a payback is a calendar term, not a decimal. */
export function formatoPlazo(meses: number | null): string {
  if (meses == null) return "No recupera en el horizonte";
  const anios = Math.floor(meses / 12);
  const resto = meses - anios * 12;
  const m = Math.floor(resto);
  const dias = Math.round((resto - m) * 30);
  const parts = [
    `${anios} ${anios === 1 ? "año" : "años"}`,
    `${m} ${m === 1 ? "mes" : "meses"}`,
    `${dias} ${dias === 1 ? "día" : "días"}`,
  ];
  return `${parts[0]}, ${parts[1]} y ${parts[2]}`;
}

export interface Indicadores {
  van: number;
  tirAnual: number | null;
  indiceRentabilidad: number;
  roi: number;
  repago: number | null;
  repagoDescontado: number | null;
  necesidadMaxima: number;
  mesNecesidadMaxima: number;
  primerMesPositivo: number | null;
  inversionUsd: number;
}

/** Horizon-wide indicators of one scenario (point 8.9 of the plan). */
export function indicadores(modelo: ModeloFinanciero, e: Escenario, tasaAnual: number): Indicadores {
  const flows = flujoNetoUsd(e, modelo.tipoCambio);
  const cum = acumulado(flows);
  const tir = tirMensual(flows);
  const inversionUsd = -flows[0];
  const minCum = Math.min(...cum);
  const vanValue = van(flows, tasaAnual);
  const firstPositive = flows.findIndex((v, t) => t > 0 && v > 0);
  return {
    van: vanValue,
    tirAnual: tir == null ? null : anualizar(tir),
    indiceRentabilidad: inversionUsd ? vanValue / inversionUsd : 0,
    roi: inversionUsd ? cum[cum.length - 1] / inversionUsd : 0,
    repago: repagoMeses(flows),
    repagoDescontado: repagoMeses(descontado(flows, tasaAnual)),
    necesidadMaxima: -minCum,
    mesNecesidadMaxima: cum.indexOf(minCum),
    primerMesPositivo: firstPositive === -1 ? null : firstPositive,
    inversionUsd,
  };
}

export interface ResumenPeriodo {
  ingresos: number;
  cobranzas: number;
  egresos: Record<RubroKey, number>;
  egresosTotal: number;
  inversion: number;
  recupero: number;
  flujoNeto: number;
  clientesCierre: number;
  mrrCierreUsd: number;
}

/** Totals of a period in ARS, with the stock measures read at its closing month. */
export function resumenPeriodo(
  modelo: ModeloFinanciero,
  e: Escenario,
  periodo: Periodo,
  plan: PlanKey | "todos" = "todos",
): ResumenPeriodo {
  const meses = mesesDelPeriodo(periodo);
  const total = (series: number[]) => meses.reduce((acc, t) => acc + (series[t] ?? 0), 0);
  const egresos = Object.fromEntries(
    RUBROS.map((r) => [r.key, total(e.egresos[r.key])]),
  ) as Record<RubroKey, number>;
  const egresosTotal = Object.values(egresos).reduce((a, b) => a + b, 0);
  const cobranzas = total(e.cobranzas);
  const inversion = total(e.inversion);
  const recupero = total(e.recupero);
  const cierre = cierreDelPeriodo(periodo);
  return {
    ingresos: meses.reduce((acc, t) => acc + ingresosEn(e, t, plan), 0),
    cobranzas,
    egresos,
    egresosTotal,
    inversion,
    recupero,
    flujoNeto: cobranzas - egresosTotal - inversion + recupero,
    clientesCierre: clientesEn(e, cierre, plan),
    mrrCierreUsd: ingresosEn(e, cierre, plan) / modelo.tipoCambio,
  };
}

export interface Penetracion {
  anio: number;
  nombre: string;
  sedes: number;
  cuentas: number;
  meta: number;
  /** cuentas ÷ sedes del área abordada × 100 (point 6.2). */
  porcentaje: number;
  porcentajeMeta: number;
}

/** Accounts at each year-end against the venues of the area covered by then. */
export function penetracion(modelo: ModeloFinanciero, e: Escenario): Penetracion[] {
  return modelo.mercado.map((m) => {
    const cuentas = clientesEn(e, cierreDelPeriodo(m.anio as Periodo));
    return {
      anio: m.anio,
      nombre: m.nombre,
      sedes: m.sedesAcumuladas,
      cuentas,
      meta: m.metaCuentas,
      porcentaje: (cuentas / m.sedesAcumuladas) * 100,
      porcentajeMeta: (m.metaCuentas / m.sedesAcumuladas) * 100,
    };
  });
}

/** Signups per town up to a month (base scenario's client list; churn is not by town). */
export function altasPorLocalidad(modelo: ModeloFinanciero, hasta: number) {
  const limite = modelo.meses[hasta];
  const orden = new Map(modelo.meses.map((m, i) => [m, i]));
  const counts = new Map<string, { total: number; porPlan: Record<PlanKey, number> }>();
  for (const c of modelo.clientes) {
    const idx = orden.get(c.alta);
    if (idx == null || idx > (orden.get(limite) ?? hasta)) continue;
    const entry = counts.get(c.localidad) ?? { total: 0, porPlan: { basico: 0, intermedio: 0, full: 0 } };
    entry.total += 1;
    entry.porPlan[c.plan] += 1;
    counts.set(c.localidad, entry);
  }
  const anilloDe = (loc: string) => modelo.mercado.find((m) => m.localidades.includes(loc))?.anillo ?? 0;
  return [...counts.entries()]
    .map(([localidad, v]) => ({ localidad, anillo: anilloDe(localidad), ...v }))
    .sort((a, b) => b.total - a.total || a.anillo - b.anillo);
}

/** Break-even accounts in a month: the Monotributo stage, then the SAS once it exists. */
export function equilibrioEn(modelo: ModeloFinanciero, e: Escenario, t: number): number {
  return e.sas[t] ? modelo.equilibrio.sas : modelo.equilibrio.monotributo;
}

/** First month under the SAS (Responsable Inscripto), or null if the scenario never gets there. */
export function mesSas(e: Escenario): number | null {
  const t = e.sas.indexOf(1);
  return t === -1 ? null : t;
}
