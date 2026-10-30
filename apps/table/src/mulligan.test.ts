import { expect, it } from 'vitest';
import { createStarterSession } from './starter-session.js';
import { confirmMulligan, handPlayer, mulliganPlayer } from './session.js';
import { renderTable } from './view.js';

const handOf = (s: ReturnType<typeof createStarterSession>, id: string) =>
  s.state.cards.filter((c) => c.zoneId === `zone:${id}:hand`);
const deckOf = (s: ReturnType<typeof createStarterSession>, id: string) =>
  s.state.cards.filter((c) => c.zoneId === `zone:${id}:deck`);

it('ouvre la partie sur le mulligan du premier joueur, quatre cartes en main', () => {
  const s = createStarterSession(42, { mulligan: true });
  expect(s.state.setup?.stage).toBe('mulligan');
  expect(mulliganPlayer(s.state)).toBe('a');
  expect(handPlayer(s.state)).toBe('a');
  expect(handOf(s, 'a')).toHaveLength(4);
  const html = renderTable(s, null, [], null, { mulligan: [] });
  expect(html).toContain('Mulligan · Joueur 1');
  expect(html).toContain('Préparation · Mulligan');
  expect(html).toContain('Garder ma main');
  expect(html).toContain('data-action="confirm-mulligan"');
});

it('marque les cartes choisies et annonce leur remplacement', () => {
  const s = createStarterSession(42, { mulligan: true });
  const [first] = handOf(s, 'a');
  const html = renderTable(s, null, [], null, { mulligan: [first!.id] });
  expect(html).toContain('mulligan-marked');
  expect(html).toContain('Remplacer 1 carte');
});

it('remplace les cartes sous le deck, puis passe au second joueur et lance le tour', () => {
  let s = createStarterSession(42, { mulligan: true });
  const replaced = handOf(s, 'a')
    .slice(0, 2)
    .map((c) => c.id);
  s = confirmMulligan(s, replaced);
  expect(s.error).toBeNull();
  expect(handOf(s, 'a')).toHaveLength(4);
  expect(
    deckOf(s, 'a')
      .slice(-2)
      .map((c) => c.id),
  ).toEqual(replaced);
  expect(s.log.join('\n')).toMatch(/Joueur 1 remplace 2 carte/);
  expect(mulliganPlayer(s.state)).toBe('b');
  expect(renderTable(s, null, [], null, { mulligan: [] })).toContain(
    'Main de Joueur 2',
  );
  s = confirmMulligan(s, []);
  expect(s.log.join('\n')).toMatch(/Joueur 2 garde sa main/);
  expect(mulliganPlayer(s.state)).toBeNull();
  expect(s.state.setup).toBeNull();
  expect(s.state.phase).toBe('main');
  expect(handOf(s, 'a')).toHaveLength(5);
});

it('refuse plus de deux cartes sans modifier la partie', () => {
  const s = createStarterSession(42, { mulligan: true });
  const ids = handOf(s, 'a')
    .slice(0, 3)
    .map((c) => c.id);
  const refused = confirmMulligan(s, ids);
  expect(refused.state).toBe(s.state);
  expect(refused.error).toMatch(/2 cartes/);
});
