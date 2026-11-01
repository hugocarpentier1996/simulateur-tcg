import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { emberMonk, consultThePast } from '../../game-data/src/index.js';
import { effectiveMight } from './effects/modifiers.js';
import { startNextTurn } from './turn/progression.js';

it('Ember Monk : +2 Might ce tour quand son propriétaire joue une carte depuis Hidden', () => {
  let s = spellScenario(consultThePast);
  s.unitDefinitions = [emberMonk];
  s.units[0] = { ...s.units[0]!, definitionId: emberMonk.id, might: 4 };
  s.resources.a = { energy: 4, power: { violet: 1 } };
  s = step(s, {
    type: 'hide-card',
    playerId: 'a',
    cardId: 'spell',
    battlefieldId: 'f',
    payment: noRunes,
  });
  const monk = (state: typeof s) =>
    effectiveMight(
      state.units.find((u) => u.id === 'ally')!,
      state,
    );
  expect(monk(s)).toBe(4);
  s = startNextTurn(startNextTurn(s).state).state;
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'a',
    payment: noRunes,
  });
  expect(monk(s)).toBe(6);
});
