/**
 * CSV/JSON parser for newsletter metrics.
 * Handles both CSV files and JSON arrays, producing typed MetricRecord arrays.
 */

export interface MetricRecord {
  date: string;
  sends: number;
  opens: number;
  clicks: number;
  unsubscribes: number;
  revenue: number;
  subscribers?: number;
}

const REQUIRED_FIELDS = [
  "date",
  "sends",
  "opens",
  "clicks",
  "unsubscribes",
  "revenue",
] as const;

/**
 * Parse a CSV string into MetricRecord array.
 * Handles standard CSVs with header row.
 */
export function parseCSV(raw: string): MetricRecord[] {
  const lines = raw.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  for (const field of REQUIRED_FIELDS) {
    if (!headers.includes(field)) {
      throw new Error(`Missing required CSV column: ${field}`);
    }
  }

  const records: MetricRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",").map((v) => v.trim());
    if (values.length !== headers.length) {
      throw new Error(
        `Row ${i + 1} has ${values.length} values, expected ${headers.length}`
      );
    }

    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j];
    }

    const record: MetricRecord = {
      date: row.date,
      sends: Number(row.sends),
      opens: Number(row.opens),
      clicks: Number(row.clicks),
      unsubscribes: Number(row.unsubscribes),
      revenue: Number(row.revenue),
    };

    if (row.subscribers !== undefined && row.subscribers !== "") {
      record.subscribers = Number(row.subscribers);
    }

    // Validate numeric fields
    for (const field of REQUIRED_FIELDS) {
      if (field === "date") continue;
      if (isNaN(record[field as keyof MetricRecord] as number)) {
        throw new Error(
          `Invalid number for ${field} on row ${i + 1}: "${row[field]}"`
        );
      }
    }

    records.push(record);
  }

  return records;
}

/**
 * Parse a JSON string into MetricRecord array.
 * Accepts a JSON array of objects with the required fields.
 */
export function parseJSON(raw: string): MetricRecord[] {
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error("JSON input must be an array of metric records");
  }

  if (data.length === 0) {
    throw new Error("JSON input must contain at least one record");
  }

  return data.map((item: Record<string, unknown>, index: number) => {
    for (const field of REQUIRED_FIELDS) {
      if (!(field in item)) {
        throw new Error(
          `Missing required field "${field}" in record at index ${index}`
        );
      }
    }

    return {
      date: String(item.date),
      sends: Number(item.sends),
      opens: Number(item.opens),
      clicks: Number(item.clicks),
      unsubscribes: Number(item.unsubscribes),
      revenue: Number(item.revenue),
      ...(item.subscribers !== undefined
        ? { subscribers: Number(item.subscribers) }
        : {}),
    };
  });
}

/**
 * Auto-detect format and parse metrics from a raw string.
 */
export function parseMetrics(raw: string): MetricRecord[] {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    return parseJSON(trimmed);
  }
  return parseCSV(trimmed);
}

/**
 * Sort records by date ascending.
 */
export function sortByDate(records: MetricRecord[]): MetricRecord[] {
  return [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
