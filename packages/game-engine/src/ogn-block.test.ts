import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { block } from '../../game-data/src/index.js';
import { combatMightBonus } from './effects/combat-bonus.js';
import { isTank } from './combat/allocation.js';

it('Block : Shield 3 et Tank jusqu’à la fin du tour', () => {
  const s = spellScenario(block);
  s.resources.a = { energy: 2, power: {} };
  const after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'ally',
      payment: noRunes,
    }),
  );
  const ally = after.units.find((u) => u.id === 'ally')!;
  expect(isTank(ally)).toBe(true);
  const defending = {
    ...after,
    showdown: {
      kind: 'combat' as const,
      battlefieldId: 'f',
      initiatorId: 'b',
      defenderId: 'a',
      stage: 'priority' as const,
      priorityPlayerId: 'a',
      consecutivePasses: 0,
      participants: ['a', 'b'],
    },
  };
  expect(combatMightBonus(ally, defending as typeof after)).toBe(3);
});
