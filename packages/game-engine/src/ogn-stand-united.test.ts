import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { standUnited } from '../../game-data/src/index.js';
import { effectiveMight } from './effects/modifiers.js';
import { startNextTurn } from './turn/progression.js';

it('Stand United : buffe une alliée ; les buffs alliés donnent +1 de plus ce tour', () => {
  const s = spellScenario(standUnited);
  s.resources.a = { energy: 3, power: {} };
  s.units.push(
    { ...s.units[0]!, id: 'buffed-ally', buffed: true, might: 2 },
    { ...s.units[1]!, id: 'buffed-enemy', buffed: true, might: 2 },
  );
  s.units[0] = { ...s.units[0]!, might: 2 };
  const after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'ally',
      payment: noRunes,
    }),
  );
  const might = (id: string, state = after) =>
    effectiveMight(
      state.units.find((u) => u.id === id)!,
      state,
    );
  expect(might('ally')).toBe(4);
  expect(might('buffed-ally')).toBe(4);
  expect(might('buffed-enemy')).toBe(3);
  const later = startNextTurn(after).state;
  expect(might('ally', later)).toBe(3);
});
