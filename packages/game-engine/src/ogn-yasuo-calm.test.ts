import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { yasuoCalm, stupefy } from '../../game-data/src/index.js';

it('Yasuo : en attaquant, dégâts égaux à sa Might actuelle à une unité ennemie ici', () => {
  let s = spellScenario(stupefy);
  s.unitDefinitions = [yasuoCalm];
  s.units[0] = {
    ...s.units[0]!,
    definitionId: yasuoCalm.id,
    zoneId: 'base-a',
    might: 6,
  };
  s.units[1]!.might = 9;
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
  s = step(s, {
    type: 'choose-attack-targets',
    playerId: 'a',
    effects: [
      {
        sourceId: 'ally',
        targetId: 'enemy',
        payment: { energyRunes: [], powerRunes: [] },
      },
    ],
  });
  s.units[0]!.temporaryEffects = [{ type: 'modify-might', amount: 2 }];
  s = resolveTop(s);
  expect(s.units.find((u) => u.id === 'enemy')!.damage).toBe(8);
});
