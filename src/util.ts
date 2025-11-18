export function normalizeText(s: string): string {
  return s.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export function normalizeValue(v: any): any {
  if (v === undefined || v === null) return null;
  if (v instanceof Date) return v.toISOString();
  if (v instanceof Set) return Array.from(v).map(normalizeValue);
  if (v instanceof Map)
    return Object.fromEntries(
      Array.from(v.entries()).map(([k, val]) => [
        String(k),
        normalizeValue(val),
      ])
    );
  if (Array.isArray(v)) return v.map(normalizeValue);
  if (typeof v === 'object') {
    const out: Record<string, any> = {};
    for (const key of Object.keys(v)) out[key] = normalizeValue(v[key]);
    return out;
  }
  if (typeof v === 'function') return undefined;
  return v;
}

export function normalizeMetadata(m: any) {
  try {
    return normalizeValue(m ?? {});
  } catch {
    return { _unsafe: String(m) };
  }
}
