/**
 * Serialisers for downloads.
 *
 * Two formats, no dependencies. A CSV writer is forty lines; a SpreadsheetML
 * writer is eighty. Adding `exceljs` or `xlsx` to produce them would put
 * hundreds of transitive packages, and their CVE history, into a build whose
 * only requirement is "the sales team can open it in Excel".
 *
 * SpreadsheetML 2003 is XML that Excel opens natively and that carries real
 * cell types — a date stays a date and a number stays a number, instead of
 * every column arriving as text the way a CSV does.
 */

export type CellValue = string | number | boolean | Date | null | undefined;

export interface Column<T> {
  /** Property on the row. */
  key: Extract<keyof T, string>;
  /** Heading as a human reads it. */
  header: string;
}

/**
 * Dates are ISO 8601 in UTC, in both formats, always.
 *
 * Rows are stored UTC. Rendering them as `07 Aug 2026` throws away the time
 * and the offset — fine on screen, wrong in a file someone will re-import,
 * sort, or reconcile against the database.
 */
function isoUtc(value: Date): string {
  return Number.isNaN(value.getTime()) ? "" : value.toISOString();
}

/* ── CSV ─────────────────────────────────────────────────────────────── */

const CRLF = "\r\n";
/** Without a BOM, Excel reads UTF-8 as the local codepage and mangles names. */
const BOM = String.fromCharCode(0xfeff);

/** Anything Excel, Sheets or LibreOffice would treat as a formula, not text. */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

export function toCsv<T>(
  rows: readonly T[],
  columns: readonly Column<T>[],
  options: { bom?: boolean } = {}
): string {
  const out: string[] = [columns.map((c) => quote(c.header)).join(",")];

  for (const row of rows) {
    const record = row as Record<string, unknown>;
    out.push(columns.map((c) => quote(csvCell(record[c.key]))).join(","));
  }

  return (options.bom === false ? "" : BOM) + out.join(CRLF) + CRLF;
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value instanceof Date) return isoUtc(value);

  const text = String(value);
  // CSV injection. A cell opening with = + - @ is executed on open, and a
  // lead's name and remarks are attacker-supplied the moment the website form
  // is public. The apostrophe is applied to text only — a genuine negative
  // number must stay a number.
  return FORMULA_LEAD.test(text) ? `'${text}` : text;
}

/** RFC 4180: quote when the field holds a delimiter, a quote or a newline. */
function quote(field: string): string {
  if (!/[",\r\n]/.test(field) && field === field.trim()) return field;
  return `"${field.replace(/"/g, '""')}"`;
}

/* ── SpreadsheetML 2003 ──────────────────────────────────────────────── */

export function toSpreadsheetXml<T>(
  rows: readonly T[],
  columns: readonly Column<T>[],
  sheetName = "Sheet1"
): string {
  const body: string[] = ["   <Row>"];
  for (const c of columns) {
    body.push(`    <Cell ss:StyleID="hdr"><Data ss:Type="String">${xml(c.header)}</Data></Cell>`);
  }
  body.push("   </Row>");

  for (const row of rows) {
    const record = row as Record<string, unknown>;
    body.push("   <Row>");
    for (const c of columns) body.push(`    ${xmlCell(record[c.key])}`);
    body.push("   </Row>");
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    // Hands the file to Excel rather than to whatever owns .xml on the machine.
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"',
    '  xmlns:o="urn:schemas-microsoft-com:office:office"',
    '  xmlns:x="urn:schemas-microsoft-com:office:excel"',
    '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
    " <Styles>",
    '  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Bottom"/></Style>',
    '  <Style ss:ID="hdr"><Font ss:Bold="1"/><Interior ss:Color="#EFEAE0" ss:Pattern="Solid"/></Style>',
    '  <Style ss:ID="dt"><NumberFormat ss:Format="dd mmm yyyy hh:mm"/></Style>',
    " </Styles>",
    ` <Worksheet ss:Name="${xml(safeSheetName(sheetName))}">`,
    "  <Table>",
    ...body,
    "  </Table>",
    '  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">',
    "   <FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal>",
    "   <TopRowBottomPane>1</TopRowBottomPane><ActivePane>2</ActivePane>",
    "  </WorksheetOptions>",
    " </Worksheet>",
    "</Workbook>",
    "",
  ].join("\n");
}

function xmlCell(value: unknown): string {
  if (value === null || value === undefined) return "<Cell/>";

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "<Cell/>";
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  if (typeof value === "boolean") {
    return `<Cell><Data ss:Type="Boolean">${value ? 1 : 0}</Data></Cell>`;
  }
  if (value instanceof Date) {
    const iso = isoUtc(value);
    if (!iso) return "<Cell/>";
    // SpreadsheetML carries no timezone. The Z is dropped and the column is
    // labelled UTC by its caller rather than quietly shifted to server local.
    return `<Cell ss:StyleID="dt"><Data ss:Type="DateTime">${iso.replace(/Z$/, "")}</Data></Cell>`;
  }

  // No formula guard here: an ss:Type="String" cell is never evaluated.
  return `<Cell><Data ss:Type="String">${xml(String(value))}</Data></Cell>`;
}

function xml(text: string): string {
  return stripControl(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/\r\n?/g, "\n")
    .replace(/\n/g, "&#10;");
}

/**
 * Control characters are illegal in XML 1.0. One of them anywhere in a remarks
 * field makes Excel reject the entire workbook, so they are dropped rather
 * than escaped — tab, newline and carriage return survive.
 */
function stripControl(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code === 9 || code === 10 || code === 13) {
      out += ch;
    } else if (code >= 32 && code !== 127) {
      out += ch;
    }
  }
  return out;
}

/** Excel rejects a sheet name over 31 characters or holding [ ] : * ? / \ */
function safeSheetName(name: string): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31);
  return cleaned || "Sheet1";
}
