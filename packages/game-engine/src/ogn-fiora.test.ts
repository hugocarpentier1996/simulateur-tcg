import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { act } from './index.js';
import { withDeflect } from './cost/deflect.js';
import { effectiveMight } from './effects/modifiers.js';
import { fiora, hextechRay } from '../../game-data/src/index.js';

function scenario(boost: number) {
  const s = spellScenario(hextechRay);
  s.unitDefinitions = [fiora];
  s.units[0] = {
    ...s.units[0]!,
    definitionId: fiora.id,
    might: 4,
    temporaryEffects: boost ? [{ type: 'modify-might', amount: boost }] : [],
  };
  s.battlefields = s.battlefields.map((f) => ({ ...f, controllerId: 'a' }));
  s.units = s.units.filter((u) => u.id !== 'enemy');
  return s;
}
const gank = {
  type: 'move' as const,
  playerId: 'a',
  unitId: 'ally',
  destinationId: 'g',
};

it('Fiora : Mighty (5+) -> Ganking et Deflect ; sinon non', () => {
  expect(act(scenario(0), gank).ok).toBe(false);
  expect(act(scenario(1), gank).ok).toBe(true);
  expect(
    withDeflect(scenario(0), 'b', { energy: 0, power: {} }, ['ally'])
      .genericPower,
  ).toBeUndefined();
  expect(
    withDeflect(scenario(1), 'b', { energy: 0, power: {} }, ['ally'])
      .genericPower,
  ).toBe(1);
});

it('Fiora : Mighty -> Shield en défense', () => {
  const s = scenario(1);
  s.showdown = {
    kind: 'combat',
    battlefieldId: 'f',
    initiatorId: 'b',
    defenderId: 'a',
    participants: ['a', 'b'],
    priorityPlayerId: 'b',
    consecutivePasses: 0,
    stage: 'priority',
    assignments: {},
  };
  expect(effectiveMight(s.units[0]!, s)).toBe(6);
  const weak = scenario(0);
  weak.showdown = s.showdown;
  expect(effectiveMight(weak.units[0]!, weak)).toBe(4);
});
