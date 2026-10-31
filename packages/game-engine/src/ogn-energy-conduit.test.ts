import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { energyConduit, incinerate } from '../../game-data/src/index.js';

it('Energy Conduit : 3 énergie ; Tap pour ajouter 1 énergie, sans pile', () => {
  let s = spellScenario(incinerate);
  s.gearDefinitions = [energyConduit];
  s.cards.push({
    id: 'conduit',
    definitionId: energyConduit.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 3, power: {} };
  s = step(s, {
    type: 'play-gear',
    playerId: 'a',
    cardId: 'conduit',
    payment: noRunes,
  });
  expect(s.resources.a!.energy).toBe(0);
  s = step(s, { type: 'activate-gear', playerId: 'a', gearId: 'conduit' });
  expect(s.resources.a).toMatchObject({ energy: 1, power: {} });
  expect(s.gears![0]!.ready).toBe(false);
});
