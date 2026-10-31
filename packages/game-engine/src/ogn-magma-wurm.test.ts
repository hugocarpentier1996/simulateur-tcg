import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { magmaWurm, mobilize } from '../../game-data/src/index.js';

it('Magma Wurm : les autres unités alliées entrent Ready, pas lui-même', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [magmaWurm];
  s.cards[0]!.definitionId = magmaWurm.id;
  s.cards.push({
    id: 'wurm-2',
    definitionId: magmaWurm.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 16, power: { rouge: 2 } };
  s = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'spell',
    payment: noRunes,
  });
  expect(s.units.find((u) => u.id === 'spell')?.ready).toBe(false);
  s = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'wurm-2',
    payment: noRunes,
  });
  expect(s.units.find((u) => u.id === 'wurm-2')?.ready).toBe(true);
});
