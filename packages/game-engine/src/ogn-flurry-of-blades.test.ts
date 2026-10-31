import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { flurryOfBlades } from '../../game-data/src/index.js';

it('Flurry of Blades : Réaction, 1 dégât à toutes les unités sur les champs, bases épargnées', () => {
  let s = spellScenario(flurryOfBlades);
  s.resources.a = { energy: 1, power: {} };
  s.units.push(
    { ...s.units[0]!, id: 'home', zoneId: 'base-a' },
    { ...s.units[1]!, id: 'weak', might: 1 },
  );
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  const damage = (id: string) => s.units.find((u) => u.id === id)?.damage;
  expect([damage('ally'), damage('enemy'), damage('home')]).toEqual([1, 1, 0]);
  expect(s.units.some((u) => u.id === 'weak')).toBe(false);
});
