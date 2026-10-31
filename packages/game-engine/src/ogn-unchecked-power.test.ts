import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { uncheckedPower } from '../../game-data/src/index.js';

it('Unchecked Power : épuise toutes les unités alliées puis 12 dégâts à toutes les unités sur les champs', () => {
  let s = spellScenario(uncheckedPower);
  s.resources.a = { energy: 7, power: { bleu: 2 } };
  s.units.push(
    { ...s.units[0]!, id: 'home', zoneId: 'base-a', ready: true },
    { ...s.units[1]!, id: 'big', might: 20 },
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
  expect(s.units.map((u) => u.id).sort()).toEqual(['big', 'home']);
  expect(s.units.find((u) => u.id === 'home')).toMatchObject({
    ready: false,
    damage: 0,
  });
  expect(s.units.find((u) => u.id === 'big')).toMatchObject({
    ready: true,
    damage: 12,
  });
});
