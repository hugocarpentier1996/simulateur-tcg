import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { sealOfInsight, incinerate } from '../../game-data/src/index.js';

it('Seal of Insight : 0 énergie et 1 Mind ; Tap pour ajouter 1 Power Mind, sans pile', () => {
  let s = spellScenario(incinerate);
  s.gearDefinitions = [sealOfInsight];
  s.cards.push({
    id: 'seal',
    definitionId: sealOfInsight.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 0, power: { bleu: 1 } };
  s = step(s, {
    type: 'play-gear',
    playerId: 'a',
    cardId: 'seal',
    payment: noRunes,
  });
  s = step(s, { type: 'activate-gear', playerId: 'a', gearId: 'seal' });
  expect(s.gears![0]!.ready).toBe(false);
  expect(s.resources.a!.power.bleu).toBe(1);
  expect(s.stack ?? null).toBeNull();
});
