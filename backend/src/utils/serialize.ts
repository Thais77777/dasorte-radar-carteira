import { Decimal } from '@prisma/client/runtime/library';

/** Converte Decimal/Date/BigInt do Prisma em tipos serializáveis em JSON. */
export function serialize<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (value instanceof Decimal) return value.toNumber() as unknown as T;
  if (value instanceof Date) return value.toISOString() as unknown as T;
  if (Array.isArray(value)) return value.map((v) => serialize(v)) as unknown as T;
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serialize(v);
    }
    return out as unknown as T;
  }
  return value;
}

export function toNumber(value: Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Decimal) return value.toNumber();
  return value;
}
