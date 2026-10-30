import { expect, it } from 'vitest';
import { createStarterSession } from './starter-session.js';
import { cardName } from './session.js';
import { renderTable } from './view.js';

/** Démo avec deux cartes de la main du Joueur 1 placées dans sa défausse. */
function withDiscards() {
  const s = createStarterSession(42);
  const hand = s.state.cards.filter((c) => c.zoneId === 'zone:a:hand');
  const moved = hand.slice(0, 2).map((c) => c.id);
  s.state.cards = s.state.cards.map((c) =>
    moved.includes(c.id) ? { ...c, zoneId: 'zone:a:graveyard' } : c,
  );
  return { s, moved: hand.slice(0, 2) };
}

it('rend les deux défausses cliquables', () => {
  const html = renderTable(createStarterSession(42), null);
  expect(html).toContain('data-graveyard="a"');
  expect(html).toContain('data-graveyard="b"');
});

it('affiche le contenu de la défausse ouverte, la plus récente en premier', () => {
  const { s, moved } = withDiscards();
  const html = renderTable(s, null, [], null, { graveyard: 'a' });
  expect(html).toContain('Défausse de Joueur 1 · 2 cartes');
  const first = html.indexOf(cardName(moved[1]!.definitionId));
  const second = html.lastIndexOf(cardName(moved[0]!.definitionId));
  expect(first).toBeGreaterThan(-1);
  expect(first).toBeLessThan(second);
  expect(html).toContain('data-action="close-graveyard"');
});

it('signale une défausse vide', () => {
  const html = renderTable(createStarterSession(42), null, [], null, {
    graveyard: 'b',
  });
  expect(html).toContain('Aucune carte dans cette défausse');
});
