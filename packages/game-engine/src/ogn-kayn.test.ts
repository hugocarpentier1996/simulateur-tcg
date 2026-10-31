import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { kayn, hextechRay } from '../../game-data/src/index.js';

function scenario(moves: number) {
  const s = spellScenario(hextechRay);
  s.unitDefinitions = [kayn];
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  s.units[1] = {
    ...s.units[1]!,
    definitionId: kayn.id,
    might: 6,
    ...(moves ? { movesThisTurn: moves } : {}),
  };
  return s;
}
const ray = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'enemy',
  payment: noRunes,
};

it('Kayn : ne subit aucun dégât s’il s’est déplacé deux fois ce tour', () => {
  const once = resolveTop(step(scenario(1), ray));
  expect(once.units.find((u) => u.id === 'enemy')?.damage).toBe(3);
  const twice = resolveTop(step(scenario(2), ray));
  expect(twice.units.find((u) => u.id === 'enemy')?.damage).toBe(0);
});

it('Kayn : chaque déplacement est compté, puis remis à zéro au tour suivant', () => {
  let s = spellScenario(hextechRay);
  s.unitDefinitions = [kayn];
  s.units[0] = { ...s.units[0]!, definitionId: kayn.id, zoneId: 'base-a' };
  s.units = s.units.filter((u) => u.id !== 'enemy');
  s.battlefields = s.battlefields.map((f) => ({ ...f, controllerId: 'a' }));
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'f',
  });
  expect(s.units[0]?.movesThisTurn).toBe(1);
  s = { ...s, units: s.units.map((u) => ({ ...u, ready: true })) };
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
  expect(s.units[0]?.movesThisTurn).toBe(2);
  s = step(s, { type: 'end-turn', playerId: 'a' });
  expect(s.units[0]?.movesThisTurn).toBeUndefined();
});
