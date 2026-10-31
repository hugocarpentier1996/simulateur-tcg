import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight, type GameState } from './index.js';
import { cleave } from '../../game-data/src/index.js';

function withCleave(): GameState {
  let s = spellScenario(cleave);
  s.resources.a = { energy: 1, power: {} };
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'ally',
      payment: noRunes,
    }),
  );
  return s;
}
const combat = (s: GameState, initiatorId: string): GameState => ({
  ...s,
  units: s.units.map((u) => ({ ...u, zoneId: 'g' })),
  showdown: {
    kind: 'combat',
    battlefieldId: 'g',
    initiatorId,
    defenderId: initiatorId === 'a' ? 'b' : 'a',
    participants: ['a', 'b'],
    priorityPlayerId: initiatorId,
    consecutivePasses: 0,
    stage: 'priority',
    assignments: {},
  },
});

it('Cleave : Assault 3 jusqu’à la fin du tour, +3 seulement en attaque', () => {
  const s = withCleave();
  expect(effectiveMight(s.units[0]!, s)).toBe(3);
  const attacking = combat(s, 'a');
  expect(effectiveMight(attacking.units[0]!, attacking)).toBe(6);
  const defending = combat(s, 'b');
  expect(effectiveMight(defending.units[0]!, defending)).toBe(3);
  const next = step(s, { type: 'end-turn', playerId: 'a' });
  const later = combat(next, 'a');
  expect(effectiveMight(later.units[0]!, later)).toBe(3);
});
