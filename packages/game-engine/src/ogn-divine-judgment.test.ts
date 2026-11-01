import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { divineJudgment } from '../../game-data/src/index.js';

it('Divine Judgment : chaque joueur garde 2 unités, 2 gears, 2 runes, 2 cartes en main ; le reste est recyclé', () => {
  const s0 = spellScenario(divineJudgment);
  s0.units.push({ ...s0.units[0]!, id: 'a2' }, { ...s0.units[0]!, id: 'a3' });
  s0.cards.push(
    { id: 'h1', definitionId: 'filler', ownerId: 'a', zoneId: 'hand-a' },
    { id: 'h2', definitionId: 'filler', ownerId: 'a', zoneId: 'hand-a' },
    { id: 'h3', definitionId: 'filler', ownerId: 'a', zoneId: 'hand-a' },
  );
  s0.resources.a = { energy: 7, power: { jaune: 2 } };
  let s = resolveTop(
    step(s0, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(s.pendingModeChoice?.ownerId).toBe('a');
  expect(s.pendingModeChoice?.modes).toEqual([
    'keep:ally+a2',
    'keep:ally+a3',
    'keep:a2+a3',
  ]);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'keep:ally+a3' });
  expect(s.pendingModeChoice?.modes).toEqual([
    'keep:h1+h2',
    'keep:h1+h3',
    'keep:h2+h3',
  ]);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'keep:h2+h3' });
  expect(s.pendingModeChoice ?? null).toBeNull();
  expect(s.units.map((u) => u.id).sort()).toEqual(['a3', 'ally', 'enemy']);
  expect(s.cards.find((c) => c.id === 'a2')?.zoneId).toBe('deck-a');
  expect(s.cards.find((c) => c.id === 'h1')?.zoneId).toBe('deck-a');
  expect(s.cards.find((c) => c.id === 'h2')?.zoneId).toBe('hand-a');
});
