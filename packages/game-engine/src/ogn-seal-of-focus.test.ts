import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { sealOfFocus, incinerate } from '../../game-data/src/index.js';

it('Seal of Focus : 0 énergie et 1 Calm ; Tap pour ajouter 1 Power Calm, sans pile', () => {
  let s = spellScenario(incinerate);
  s.gearDefinitions = [sealOfFocus];
  s.cards.push({
    id: 'seal',
    definitionId: sealOfFocus.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 0, power: { vert: 1 } };
  s = step(s, {
    type: 'play-gear',
    playerId: 'a',
    cardId: 'seal',
    payment: noRunes,
  });
  s = step(s, { type: 'activate-gear', playerId: 'a', gearId: 'seal' });
  expect(s.gears![0]!.ready).toBe(false);
  expect(s.resources.a!.power.vert).toBe(1);
  expect(s.stack ?? null).toBeNull();
});
