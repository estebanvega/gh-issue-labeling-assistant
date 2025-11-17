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
