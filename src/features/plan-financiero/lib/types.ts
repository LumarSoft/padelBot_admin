/**
 * The business plan's financial model, as the BI board reads it.
 *
 * It mirrors the «Datos_BI» sheet of the model workbook (e-Predios_Modelo_Financiero): every
 * monthly series of every risk scenario, in ARS of constant August-2026 value, 37 positions
 * from month 0 (December 2026, the investment) to month 36 (December 2029). Nothing here is
 * live club data — the ops console's Negocio screen is the place for that.
 */

export type PlanKey = "basico" | "intermedio" | "full";

export type RubroKey =
  | "remuneraciones"
  | "honorarios"
  | "marketing"
  | "desarrollo"
  | "infraestructura"
  | "mensajeria"
  | "impuestos"
  | "ganancias_cierre";

export interface Escenario {
  id: string;
  nombre: string;
  supuestos: string;
  /** Billed accounts per plan and month (the model bills from the month after signup). */
  clientes: Record<PlanKey, number[]>;
  /** Accrued subscription revenue per plan and month, ARS. */
  ingresos: Record<PlanKey, number[]>;
  /** Cash actually collected (80 % same month, 20 % at 30 days), ARS. */
  cobranzas: number[];
  /** Cash out per budget line, ARS, positive numbers. */
  egresos: Record<RubroKey, number[]>;
  inversion: number[];
  /** Working capital and receivables recovered at the end of the horizon, ARS. */
  recupero: number[];
  /** 1 from the month the SAS (Responsable Inscripto) is constituted, 0 under Monotributo. */
  sas: number[];
  /** The workbook's own results, kept to check the board's calculations against. */
  excel?: {
    van: number;
    tirAnual: number;
    payback: string;
    paybackDescontado: string;
    primerMesPositivo: string;
  };
}

export interface ClientePlan {
  id: number;
  localidad: string;
  canchas: number;
  plan: PlanKey;
  /** Signup month as the workbook writes it ("Ene 2027"). */
  alta: string;
}

export interface AnilloMercado {
  anillo: number;
  anio: number;
  nombre: string;
  localidades: string[];
  /** Padel venues in the ring (directory count, plan point 4.3). */
  sedes: number;
  /** Venues in the whole area covered by that year. */
  sedesAcumuladas: number;
  /** Accounts the plan commits to at the end of that year (point 6.2). */
  metaCuentas: number;
}

export interface ModeloFinanciero {
  fuente: string;
  actualizado: string;
  tipoCambio: number;
  /** Annual discount rate in USD (0.3 = 30 %). */
  tasaCorte: number;
  precios: Record<PlanKey, number>;
  equilibrio: {
    monotributo: number;
    sas: number;
    margenMonotributo: number;
    costosFijosMonotributo: number;
    margenSas: number;
    costosFijosSas: number;
  };
  mercado: AnilloMercado[];
  /** "Dic 2026", "Ene 2027", … "Dic 2029" — 37 labels. */
  meses: string[];
  escenarios: Escenario[];
  /** Signup list of the base scenario (sheet Clientes). */
  clientes: ClientePlan[];
  bajas: { mes: string; plan: PlanKey; cantidad: number }[];
}

export const PLANES: { key: PlanKey; label: string }[] = [
  { key: "basico", label: "Básico" },
  { key: "intermedio", label: "Intermedio" },
  { key: "full", label: "Full" },
];

/** Budget lines of the cash flow, with the short name the cascade prints under each column. */
export const RUBROS: { key: RubroKey; label: string; corto: string }[] = [
  { key: "remuneraciones", label: "Remuneraciones y cargas", corto: "Sueldos" },
  { key: "honorarios", label: "Honorarios contables", corto: "Contador" },
  { key: "marketing", label: "Marketing y publicidad", corto: "Marketing" },
  { key: "desarrollo", label: "Investigación y desarrollo", corto: "I+D" },
  { key: "infraestructura", label: "Infraestructura cloud", corto: "Cloud" },
  { key: "mensajeria", label: "Mensajería Meta e IA", corto: "Meta e IA" },
  { key: "impuestos", label: "Impuestos", corto: "Impuestos" },
  { key: "ganancias_cierre", label: "Ganancias y saldos al cierre", corto: "Ganancias" },
];

/** "Todo el horizonte" or one calendar year of the plan. */
export type Periodo = "todo" | 2027 | 2028 | 2029;
