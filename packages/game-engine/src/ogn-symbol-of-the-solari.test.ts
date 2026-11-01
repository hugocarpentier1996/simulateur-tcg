import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { symbolOfTheSolari, stupefy } from '../../game-data/src/index.js';
import { finishCombat } from './combat/finish.js';

function tied(withSymbol: boolean) {
  const s = spellScenario(stupefy);
  s.gearDefinitions = [symbolOfTheSolari];
  s.gears = withSymbol
    ? [
        {
          id: 'sun',
          definitionId: symbolOfTheSolari.id,
          ownerId: 'a',
          zoneId: 'base-a',
          ready: true,
        },
      ]
    : [];
  s.units[0] = { ...s.units[0]!, zoneId: 'g' };
  s.showdown = {
    kind: 'combat',
    battlefieldId: 'g',
    initiatorId: 'a',
    defenderId: 'b',
    participants: ['a', 'b'],
    stage: 'priority',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
    assignments: {},
    shieldBonuses: {},
  } as never;
  return finishCombat(s).state;
}

it('Symbol of the Solari : combat attaqué à égalité -> toutes les unités rappelées', () => {
  const s = tied(true);
  expect(s.units.find((u) => u.id === 'ally')?.zoneId).toBe('base-a');
  expect(s.units.find((u) => u.id === 'enemy')?.zoneId).toBe('base-b');
  expect(s.battlefields.find((f) => f.zoneId === 'g')?.controllerId).toBeNull();
  const normal = tied(false);
  expect(normal.units.find((u) => u.id === 'enemy')?.zoneId).toBe('g');
});
