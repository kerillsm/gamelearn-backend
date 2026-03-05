export function omit<T extends Record<string, unknown>, K extends string>(
  obj: T,
  keys: readonly K[],
): Omit<T, K> {
  const out: Record<string, unknown> = { ...obj };
  for (const k of keys) delete out[k];
  return out as Omit<T, K>;
}
