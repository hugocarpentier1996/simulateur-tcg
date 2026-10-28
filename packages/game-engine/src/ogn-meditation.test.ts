import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './act.js';
import { getLegalActions } from './legal/actions.js';
import { meditation } from '../../game-data/src/index.js';
const cast = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'a',
  payment: noRunes,
};
it.each([false, true])(
  'Meditation paie le Tap au lancement et pioche selon ce coût : %s',
  (exhaust) => {
    let s = spellScenario(meditation);
    const action = { ...cast, ...(exhaust ? { exhaustUnitId: 'ally' } : {}) };
    expect(getLegalActions(s, 'a')).toContainEqual(action);
    s = step(s, action);
    expect(s.units[0]!.ready).toBe(!exhaust);
    if (exhaust) s = { ...s, units: s.units.filter((u) => u.id !== 'ally') };
    s = resolveTop(s);
    expect(s.cards.filter((c) => c.zoneId === 'hand-a')).toHaveLength(
      exhaust ? 2 : 1,
    );
  },
);
it('refuse de Tap une unité adverse ou déjà Tap ; un paiement refusé ne Tap rien', () => {
  const s = spellScenario(meditation);
  expect(act(s, { ...cast, exhaustUnitId: 'enemy' }).ok).toBe(false);
  s.units[0]!.ready = false;
  expect(act(s, { ...cast, exhaustUnitId: 'ally' }).ok).toBe(false);
  s.units[0]!.ready = true;
  s.resources.a!.energy = 0;
  expect(act(s, { ...cast, exhaustUnitId: 'ally' }).ok).toBe(false);
  expect(s.units[0]!.ready).toBe(true);
});
