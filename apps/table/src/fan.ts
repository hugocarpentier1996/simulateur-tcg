/** Nombre de cartes -> rotations symétriques (maximum ±12°) et décalages verticaux en px.
 * Zéro carte donne un tableau vide ; une carte reste droite. Géométrie pure, sans DOM. */
export function fanLayout(count: number): { angle: number; lift: number }[] {
  const middle = (count - 1) / 2;
  const step = count > 1 ? Math.min(4, 24 / (count - 1)) : 0;
  return Array.from({ length: count }, (_, index) => {
    const angle = (index - middle) * step;
    return { angle, lift: Math.abs(angle) * 1.5 };
  });
}
