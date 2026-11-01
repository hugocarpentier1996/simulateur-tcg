import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { adaptatron, promisingFuture } from '../../game-data/src/index.js';

it('Promising Future : chacun choisit une carte parmi les 5 du dessus, recycle le reste, puis la joue sans payer son énergie', () => {
  const s0 = spellScenario(promisingFuture);
  s0.unitDefinitions = [adaptatron];
  s0.cards = s0.cards.map((c) =>
    c.id.startsWith('draw-') ? { ...c, definitionId: adaptatron.id } : c,
  );
  s0.resources.a = { energy: 5, power: { bleu: 1 } };
  s0.resources.b = { energy: 0, power: {} };
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
    'future:draw-a-0',
    'future:draw-a-1',
    'future:draw-a-2',
  ]);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'future:draw-a-1' });
  expect(s.pendingModeChoice?.ownerId).toBe('b');
  s = step(s, { type: 'choose-mode', playerId: 'b', mode: 'future:draw-b-2' });
  expect(s.pendingModeChoice ?? null).toBeNull();
  expect(s.units.find((u) => u.id === 'draw-a-1')?.zoneId).toBe('base-a');
  expect(s.units.find((u) => u.id === 'draw-b-2')?.zoneId).toBe('base-b');
  expect(s.cards.filter((c) => c.zoneId === 'deck-a').map((c) => c.id)).toEqual(
    ['draw-a-0', 'draw-a-2'],
  );
  expect(s.resources.b?.energy).toBe(0);
});
