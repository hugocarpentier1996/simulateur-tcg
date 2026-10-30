import { expect, it } from 'vitest';
import { createStarterSession } from './starter-session.js';
import { useRune } from './session.js';
import { renderTable } from './view.js';

/** Rune du Joueur 1 -> balise rendue, extraite du HTML de la table. */
function runeTag(html: string, runeId: string): string {
  const start = html.indexOf(`data-rune="${runeId}"`);
  return html.slice(
    html.lastIndexOf('<article', start),
    html.indexOf('</article>', start),
  );
}

it('montre chaque rune par son illustration, sa couleur et son état', () => {
  const s = createStarterSession(42);
  const [rune] = s.state.cards.filter((c) => c.zoneId === 'zone:a:runes');
  const tag = runeTag(renderTable(s, null), rune!.id);
  expect(tag).toContain(`rune-card ${rune!.color} ready`);
  expect(tag).toContain('class="rune-face"');
  expect(tag).toContain('<img class="rune-art"');
  expect(tag).not.toContain('<small>');
  expect(tag).toMatch(/aria-label="Rune \w+ · Ready"/);
});

it('couche une rune Tap à 90°, comme une unité', () => {
  const s = createStarterSession(42);
  const [rune] = s.state.cards.filter((c) => c.zoneId === 'zone:a:runes');
  const tapped = useRune(s, rune!.id, 'tap');
  const tag = runeTag(renderTable(tapped, null), rune!.id);
  expect(tag).toContain(`rune-card ${rune!.color} tapped`);
  expect(tag).toMatch(/aria-label="Rune \w+ · Tap"/);
});
