export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

export class CsvParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvParseError";
  }
}

export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

export function parseCsv(input: string): ParsedCsv {
  const text = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let index = 0;

  const pushField = () => {
    row.push(field);
    field = "";
  };

  const pushRow = () => {
    pushField();
    const isBlank = row.every((cell) => cell.trim() === "");
    if (!isBlank) records.push(row);
    row = [];
  };

  while (index < text.length) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }

    if (char === '"') {
      if (field.length > 0) {
        throw new CsvParseError(`Unexpected quote on line ${records.length + 1}.`);
      }
      inQuotes = true;
      index += 1;
      continue;
    }
    if (char === ",") {
      pushField();
      index += 1;
      continue;
    }
    if (char === "\n") {
      pushRow();
      index += 1;
      continue;
    }
    field += char;
    index += 1;
  }

  if (inQuotes) {
    throw new CsvParseError("The CSV file contains an unterminated quoted value.");
  }
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  const [headerRow, ...dataRows] = records;
  if (!headerRow) {
    throw new CsvParseError("The CSV file is empty.");
  }

  return {
    headers: headerRow.map((header) => header.trim()),
    rows: dataRows.map((dataRow) => {
      const cells = [...dataRow];
      while (cells.length < headerRow.length) cells.push("");
      return cells.slice(0, headerRow.length).map((cell) => cell.trim());
    }),
  };
}

export function recordsFromCsv(parsed: ParsedCsv): Array<Record<string, string>> {
  return parsed.rows.map((row) => {
    const record: Record<string, string> = {};
    parsed.headers.forEach((header, headerIndex) => {
      record[normalizeHeader(header)] = row[headerIndex] ?? "";
    });
    return record;
  });
}

export function requireHeaders(
  parsed: ParsedCsv,
  required: Array<{ key: string; label: string }>,
): void {
  const available = new Set(parsed.headers.map(normalizeHeader));
  const missing = required.filter((header) => !available.has(header.key));
  if (missing.length > 0) {
    throw new CsvParseError(
      `Missing required column${missing.length > 1 ? "s" : ""}: ${missing
        .map((header) => header.label)
        .join(", ")}.`,
    );
  }
}
