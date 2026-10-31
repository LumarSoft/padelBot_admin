import type { Escenario, ModeloFinanciero, PlanKey, RubroKey } from "./types";
import { PLANES, RUBROS } from "./types";

/**
 * Loads the board from the model workbook itself: the .xlsx (sheet «Datos_BI», plus the
 * exchange rate and discount rate from «Parametros» and the client list from «Clientes»
 * when present) or that sheet exported as .csv. No spreadsheet library: an .xlsx is a zip
 * of XML files, and the browser already inflates zip entries (DecompressionStream).
 */

export interface FilaDatosBI {
  escenario: string;
  mes: number;
  periodo: string;
  indicador: string;
  categoria: string;
  valor: number;
}

export class ImportError extends Error {}

// ── Rows → model ─────────────────────────────────────────────────────────────

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const PLAN_BY_LABEL = new Map(PLANES.map((p) => [norm(p.label), p.key]));

/** The workbook's long labels → the board's budget lines. */
const RUBRO_BY_LABEL: [string, RubroKey][] = [
  ["remuneraciones", "remuneraciones"],
  ["honorarios", "honorarios"],
  ["marketing", "marketing"],
  ["investigacion", "desarrollo"],
  ["infraestructura", "infraestructura"],
  ["mensajeria", "mensajeria"],
  ["impuestos", "impuestos"],
  ["ganancias", "ganancias_cierre"],
];

const ESCENARIO_IDS: [string, string][] = [
  ["severo con contingencia", "severo_contingencia"],
  ["pesimista severo", "pesimista_severo"],
  ["pesimista moderado", "pesimista_moderado"],
  ["optimista", "optimista"],
  ["base", "base"],
];

function escenarioId(nombre: string): string {
  const n = norm(nombre);
  return ESCENARIO_IDS.find(([label]) => n.startsWith(label))?.[1] ?? n.replace(/\s+/g, "_");
}

export function modeloDesdeFilas(filas: FilaDatosBI[], base: ModeloFinanciero): ModeloFinanciero {
  if (!filas.length) throw new ImportError("La hoja Datos_BI está vacía.");
  const horizonte = Math.max(...filas.map((f) => f.mes));
  const length = horizonte + 1;
  const zeros = () => Array.from({ length }, () => 0);
  const meses = Array.from({ length }, (_, i) => base.meses[i] ?? `Mes ${i}`);
  const porNombre = new Map<string, Escenario>();

  for (const f of filas) {
    if (f.mes < 0 || f.mes > horizonte) continue;
    meses[f.mes] = f.periodo || meses[f.mes];
    let e = porNombre.get(f.escenario);
    if (!e) {
      const id = escenarioId(f.escenario);
      e = {
        id,
        nombre: f.escenario,
        supuestos: base.escenarios.find((b) => b.id === id)?.supuestos ?? "",
        clientes: { basico: zeros(), intermedio: zeros(), full: zeros() },
        ingresos: { basico: zeros(), intermedio: zeros(), full: zeros() },
        cobranzas: zeros(),
        egresos: Object.fromEntries(RUBROS.map((r) => [r.key, zeros()])) as Record<RubroKey, number[]>,
        inversion: zeros(),
        recupero: zeros(),
        sas: zeros(),
      };
      porNombre.set(f.escenario, e);
    }
    const ind = norm(f.indicador);
    const cat = norm(f.categoria);
    if (ind.startsWith("clientes")) {
      const plan = PLAN_BY_LABEL.get(cat);
      if (plan) e.clientes[plan][f.mes] = f.valor;
    } else if (ind.startsWith("ingresos")) {
      const plan = PLAN_BY_LABEL.get(cat);
      if (plan) e.ingresos[plan][f.mes] = f.valor;
    } else if (ind.startsWith("cobranzas")) {
      e.cobranzas[f.mes] = f.valor;
    } else if (ind.startsWith("egresos")) {
      const rubro = RUBRO_BY_LABEL.find(([label]) => cat.startsWith(label))?.[1];
      if (rubro) e.egresos[rubro][f.mes] = f.valor;
    } else if (ind.startsWith("inversion")) {
      e.inversion[f.mes] = f.valor;
    } else if (ind.startsWith("recupero")) {
      e.recupero[f.mes] = f.valor;
    } else if (ind.startsWith("regimen sas")) {
      e.sas[f.mes] = f.valor ? 1 : 0;
    }
    // «Flujo neto ARS» is a control column: the board derives it, it never reads it.
  }

  const escenarios = [...porNombre.values()];
  if (!escenarios.some((e) => e.cobranzas.some(Boolean))) {
    throw new ImportError("No se encontraron cobranzas en la hoja Datos_BI.");
  }
  return { ...base, meses, escenarios };
}

// ── CSV ──────────────────────────────────────────────────────────────────────

function parseNumber(raw: string): number {
  const s = raw.trim();
  if (!s) return 0;
  // Spanish-locale exports write "1.234,5"; the model's own export writes "1234.5".
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function splitCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

function filasDesdeTabla(tabla: string[][]): FilaDatosBI[] {
  const [header, ...body] = tabla;
  const col = (name: string) => header.findIndex((h) => norm(h).startsWith(name));
  const idx = {
    escenario: col("escenario"),
    mes: col("mes"),
    periodo: col("periodo"),
    indicador: col("indicador"),
    categoria: col("categoria"),
    valor: col("valor"),
  };
  if (Object.values(idx).some((i) => i < 0)) {
    throw new ImportError(
      "Faltan columnas: se esperan Escenario, Mes, Período, Indicador, Categoría y Valor.",
    );
  }
  return body.map((r) => ({
    escenario: (r[idx.escenario] ?? "").trim(),
    mes: Math.round(parseNumber(r[idx.mes] ?? "")),
    periodo: (r[idx.periodo] ?? "").trim(),
    indicador: r[idx.indicador] ?? "",
    categoria: r[idx.categoria] ?? "",
    valor: parseNumber(r[idx.valor] ?? ""),
  }));
}

export function filasDesdeCsv(text: string): FilaDatosBI[] {
  const firstLine = text.slice(0, text.indexOf("\n") >>> 0);
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  return filasDesdeTabla(splitCsv(text.replace(/^﻿/, ""), delimiter));
}

// ── XLSX (zip + XML) ─────────────────────────────────────────────────────────

async function unzip(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  // End of central directory: scan backwards for its signature.
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ImportError("El archivo no es un .xlsx válido.");
  const entries = view.getUint16(eocd + 10, true);
  let ptr = view.getUint32(eocd + 16, true);
  const files = new Map<string, Uint8Array>();
  const decoder = new TextDecoder();
  for (let n = 0; n < entries; n++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break;
    const method = view.getUint16(ptr + 10, true);
    const compSize = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localOffset = view.getUint32(ptr + 42, true);
    const name = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
    ptr += 46 + nameLen + extraLen + commentLen;
    if (!name.endsWith(".xml") && !name.endsWith(".rels")) continue;
    const localNameLen = view.getUint16(localOffset + 26, true);
    const localExtraLen = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLen + localExtraLen;
    const data = bytes.slice(start, start + compSize);
    if (method === 0) files.set(name, data);
    else if (method === 8) {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      files.set(name, new Uint8Array(await new Response(stream).arrayBuffer()));
    }
  }
  return files;
}

function xml(files: Map<string, Uint8Array>, path: string): Document | null {
  const data = files.get(path);
  return data ? new DOMParser().parseFromString(new TextDecoder().decode(data), "application/xml") : null;
}

/** Column letters of a cell reference → 0-based index ("C12" → 2). */
function columnIndex(ref: string): number {
  let n = 0;
  for (const ch of ref.replace(/\d+$/, "")) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function readSheet(
  files: Map<string, Uint8Array>,
  sheetName: string,
  shared: string[],
): string[][] | null {
  const wb = xml(files, "xl/workbook.xml");
  const rels = xml(files, "xl/_rels/workbook.xml.rels");
  if (!wb || !rels) return null;
  const sheet = [...wb.getElementsByTagName("sheet")].find(
    (s) => norm(s.getAttribute("name") ?? "") === norm(sheetName),
  );
  if (!sheet) return null;
  const rid = sheet.getAttribute("r:id") ?? sheet.getAttributeNS(
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "id",
  );
  const target = [...rels.getElementsByTagName("Relationship")]
    .find((r) => r.getAttribute("Id") === rid)
    ?.getAttribute("Target");
  if (!target) return null;
  const path = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
  const doc = xml(files, path);
  if (!doc) return null;
  const rows: string[][] = [];
  for (const row of doc.getElementsByTagName("row")) {
    const values: string[] = [];
    for (const c of row.getElementsByTagName("c")) {
      const ref = c.getAttribute("r") ?? "";
      const type = c.getAttribute("t");
      const v = c.getElementsByTagName("v")[0]?.textContent ?? "";
      let value = v;
      if (type === "s") value = shared[Number(v)] ?? "";
      else if (type === "inlineStr") value = c.getElementsByTagName("t")[0]?.textContent ?? "";
      values[ref ? columnIndex(ref) : values.length] = value;
    }
    rows[Number(row.getAttribute("r") ?? rows.length + 1) - 1] = Array.from(values, (v) => v ?? "");
  }
  return Array.from(rows, (r) => r ?? []);
}

export async function modeloDesdeXlsx(file: File, base: ModeloFinanciero): Promise<ModeloFinanciero> {
  const files = await unzip(await file.arrayBuffer());
  const sst = xml(files, "xl/sharedStrings.xml");
  const shared = sst
    ? [...sst.getElementsByTagName("si")].map((si) =>
        [...si.getElementsByTagName("t")].map((t) => t.textContent ?? "").join(""),
      )
    : [];
  const datos = readSheet(files, "Datos_BI", shared);
  if (!datos) throw new ImportError("El libro no tiene la hoja Datos_BI.");
  const modelo = modeloDesdeFilas(filasDesdeTabla(datos.filter((r) => r.some(Boolean))), base);

  const parametros = readSheet(files, "Parametros", shared);
  const tipoCambio = Number(parametros?.[3]?.[1]);
  const tasaCorte = Number(parametros?.[4]?.[1]);

  const clientesSheet = readSheet(files, "Clientes", shared);
  const planPorId: Record<string, PlanKey> = { "1": "basico", "2": "intermedio", "3": "full" };
  const clientes =
    clientesSheet
      ?.slice(1)
      .filter((r) => /^\d+(\.0+)?$/.test(r[0] ?? "") && planPorId[String(Number(r[5]))])
      .map((r) => ({
        id: Number(r[0]),
        localidad: r[2] ?? "",
        canchas: Number(r[4]),
        plan: planPorId[String(Number(r[5]))],
        alta: r[7] ?? "",
      })) ?? [];

  return {
    ...modelo,
    fuente: `${file.name} — hoja Datos_BI`,
    actualizado: new Date().toISOString().slice(0, 10),
    tipoCambio: tipoCambio > 0 ? tipoCambio : modelo.tipoCambio,
    tasaCorte: tasaCorte > 0 && tasaCorte < 5 ? tasaCorte : modelo.tasaCorte,
    clientes: clientes.length ? clientes : modelo.clientes,
  };
}

export async function modeloDesdeArchivo(file: File, base: ModeloFinanciero): Promise<ModeloFinanciero> {
  if (/\.xlsx$/i.test(file.name)) return modeloDesdeXlsx(file, base);
  if (/\.(csv|txt)$/i.test(file.name)) return modeloDesdeFilas(filasDesdeCsv(await file.text()), base);
  throw new ImportError("Subí el modelo en .xlsx o la hoja Datos_BI exportada en .csv.");
}
