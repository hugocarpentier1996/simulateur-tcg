import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight } from './index.js';
import { grandStrategem } from '../../game-data/src/index.js';

it('Grand Strategem : +5 Might à toutes les unités alliées, partout, jusqu’à la fin du tour', () => {
  let s = spellScenario(grandStrategem);
  s.resources.a = { energy: 6, power: { jaune: 3 } };
  s.units.push({ ...s.units[0]!, id: 'home', zoneId: 'base-a' });
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  const might = (id: string) =>
    effectiveMight(
      s.units.find((u) => u.id === id)!,
      s,
    );
  expect([might('ally'), might('home'), might('enemy')]).toEqual([8, 8, 3]);
  s = step(s, { type: 'end-turn', playerId: 'a' });
  expect(might('ally')).toBe(3);
});
