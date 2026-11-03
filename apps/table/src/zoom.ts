/** Agrandissement au survol : retrouve l'illustration d'une carte survolée et calcule la
 * position de l'aperçu, sans toucher à la partie. */

/** Conteneurs dont l'illustration peut être agrandie (cartes en main et en jeu, gears,
 * légende, champion, pile, défausse, en-tête d'un champ de bataille). */
const HOSTS =
  '[data-card],[data-gear],.stack-item,.graveyard-list li,.legend-button,.identity-zone,.chosen-zone,.champion-back';

/** Élément survolé -> image à agrandir, ou null (fond de champ, zones vides, boutons). */
export function zoomImage(target: Element | null): HTMLImageElement | null {
  if (!target) return null;
  // Champ de bataille : seulement via son en-tête, pas son illustration de fond.
  const header = target.closest('.zone.battlefield > header');
  if (header)
    return (
      header.parentElement?.querySelector<HTMLImageElement>('img.field-art') ??
      null
    );
  const isImg = target.tagName === 'IMG';
  if (isImg && target.classList.contains('field-art')) return null;
  const host = target.closest(HOSTS);
  const img = isImg
    ? (target as HTMLImageElement)
    : (host?.querySelector<HTMLImageElement>('img') ?? null);
  if (!img || !host || !host.contains(img)) return null;
  return img.classList.contains('card-preview') ||
    img.classList.contains('reaction-art')
    ? null
    : img;
}

/** Position de l'aperçu (w×h) près du pointeur, gardée dans la fenêtre (vw×vh) : à droite du
 * pointeur s'il y a la place, sinon à gauche ; centré verticalement puis borné. */
export function zoomPosition(
  x: number,
  y: number,
  w: number,
  h: number,
  vw: number,
  vh: number,
  gap = 24,
): { left: number; top: number } {
  const left = x + gap + w <= vw ? x + gap : Math.max(8, x - gap - w);
  const top = Math.min(Math.max(8, y - h / 2), Math.max(8, vh - h - 8));
  return { left, top };
}
