import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { sealOfStrength, incinerate } from '../../game-data/src/index.js';

it('Seal of Strength : 0 énergie et 1 Body ; Tap pour ajouter 1 Power Body, sans pile', () => {
  let s = spellScenario(incinerate);
  s.gearDefinitions = [sealOfStrength];
  s.cards.push({
    id: 'seal',
    definitionId: sealOfStrength.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 0, power: { orange: 1 } };
  s = step(s, {
    type: 'play-gear',
    playerId: 'a',
    cardId: 'seal',
    payment: noRunes,
  });
  s = step(s, { type: 'activate-gear', playerId: 'a', gearId: 'seal' });
  expect(s.gears![0]!.ready).toBe(false);
  expect(s.resources.a!.power.orange).toBe(1);
  expect(s.stack ?? null).toBeNull();
});
