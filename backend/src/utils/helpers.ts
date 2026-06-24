import crypto from 'crypto';

// Generates a UUID using Node built-in crypto (no uuid package needed)
export function generateId(): string {
  return crypto.randomUUID();
}

// Converts MySQL snake_case row keys to camelCase for frontend
export function toCamel(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

export function rowsToCamel(rows: Record<string, any>[]): Record<string, any>[] {
  return rows.map(toCamel);
}

// Auto-generate next file number: MVA-YYYY-XXXX
export function generateFileNo(lastSeq: number): string {
  const year = new Date().getFullYear();
  const seq = String(lastSeq + 1).padStart(4, '0');
  return `MVA-${year}-${seq}`;
}

// Format date to YYYY-MM-DD string or null
export function formatDate(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val.slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return null;
}
