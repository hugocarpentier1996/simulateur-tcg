import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { sealOfDiscord, incinerate } from '../../game-data/src/index.js';

it('Seal of Discord : 0 énergie et 1 Chaos ; Tap pour ajouter 1 Power Chaos, sans pile', () => {
  let s = spellScenario(incinerate);
  s.gearDefinitions = [sealOfDiscord];
  s.cards.push({
    id: 'seal',
    definitionId: sealOfDiscord.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 0, power: { violet: 1 } };
  s = step(s, {
    type: 'play-gear',
    playerId: 'a',
    cardId: 'seal',
    payment: noRunes,
  });
  s = step(s, { type: 'activate-gear', playerId: 'a', gearId: 'seal' });
  expect(s.gears![0]!.ready).toBe(false);
  expect(s.resources.a!.power.violet).toBe(1);
  expect(s.stack ?? null).toBeNull();
});
