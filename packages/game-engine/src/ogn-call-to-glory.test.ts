import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { buffUnit } from './effects/buff.js';
import { callToGlory } from '../../game-data/src/index.js';

it('Call to Glory : Réaction ; +3 Might à une unité ce tour, gratuit en dépensant un buff', () => {
  let s = buffUnit(spellScenario(callToGlory), 'ally');
  s.resources.a = { energy: 0, power: {} };
  const might = effectiveMight(s.units[1]!, s);
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      spendBuffUnitId: 'ally',
      payment: noRunes,
    }),
  );
  expect(effectiveMight(s.units[1]!, s)).toBe(might + 3);
  expect(callToGlory.timing).toBe('reaction');
});
