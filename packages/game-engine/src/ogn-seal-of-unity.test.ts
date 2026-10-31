import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { sealOfUnity, incinerate } from '../../game-data/src/index.js';

it('Seal of Unity : 0 énergie et 1 Order ; Tap pour ajouter 1 Power Order, sans pile', () => {
  let s = spellScenario(incinerate);
  s.gearDefinitions = [sealOfUnity];
  s.cards.push({
    id: 'seal',
    definitionId: sealOfUnity.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 0, power: { jaune: 1 } };
  s = step(s, {
    type: 'play-gear',
    playerId: 'a',
    cardId: 'seal',
    payment: noRunes,
  });
  s = step(s, { type: 'activate-gear', playerId: 'a', gearId: 'seal' });
  expect(s.gears![0]!.ready).toBe(false);
  expect(s.resources.a!.power.jaune).toBe(1);
  expect(s.stack ?? null).toBeNull();
});
