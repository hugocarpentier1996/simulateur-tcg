import { expect, it } from 'vitest';
import { spellScenario, step } from './origins-test-fixtures.js';
import { tryndamere, stupefy } from '../../game-data/src/index.js';
import { unitConquerEntries } from './effects/unit-conquer.js';

function scenario(excess: number) {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [tryndamere];
  s.units = [
    {
      ...s.units[0]!,
      id: 'trynd',
      definitionId: tryndamere.id,
      zoneId: 'g',
      might: 8,
    },
  ];
  s.combatExcess = { battlefieldId: 'g', playerId: 'a', amount: excess };
  s.stack = {
    entries: [],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  return s;
}

it('Tryndamere : conquête après une attaque avec 5 dégâts excédentaires ou plus -> 1 point', () => {
  const entries = unitConquerEntries(scenario(5), 'a', 'g');
  expect(entries).toEqual([
    {
      kind: 'play-effect',
      sourceId: 'trynd',
      ownerId: 'a',
      effect: { type: 'score-points', amount: 1 },
    },
  ]);
  expect(unitConquerEntries(scenario(4), 'a', 'g')).toEqual([]);
  const s = scenario(5);
  s.stack = { ...s.stack!, entries };
  const after = step(step(s, { type: 'pass', playerId: 'a' }), {
    type: 'pass',
    playerId: 'b',
  });
  expect(after.players.find((p) => p.id === 'a')?.score).toBe(1);
});
