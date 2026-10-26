/** Séquence + graine uint32 -> copie mélangée et nouvel état du hasard.
 * Fisher-Yates avec LCG, sans état global ; reproductible, non cryptographique.
 * Conserver la graine choisie côté serveur dans l'état initial du replay. */
export function shuffle<T>(
  items: readonly T[],
  seed: number,
): { items: T[]; seed: number } {
  const result = [...items];
  let current = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    current = (Math.imul(1664525, current) + 1013904223) >>> 0;
    const j = Math.floor((current / 4294967296) * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return { items: result, seed: current };
}
