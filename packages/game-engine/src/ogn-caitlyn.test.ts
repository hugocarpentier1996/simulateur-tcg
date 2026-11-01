import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { caitlyn, mobilize } from '../../game-data/src/index.js';

function scenario(zoneId: string) {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [caitlyn];
  s.units[0] = {
    ...s.units[0]!,
    id: 'cait',
    definitionId: caitlyn.id,
    might: 3,
    zoneId,
  };
  s.units[1] = { ...s.units[1]!, might: 5 };
  return s;
}
const shoot = {
  type: 'activate-gear' as const,
  playerId: 'a',
  gearId: 'cait',
  targetId: 'enemy',
  payment: noRunes,
};

it('Caitlyn : Tap sur un champ — inflige sa Might à une unité sur un champ', () => {
  expect(getLegalActions(scenario('f'), 'a')).toContainEqual(
    expect.objectContaining(shoot),
  );
  const s = resolveTop(step(scenario('f'), shoot));
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(3);
  expect(s.units.find((u) => u.id === 'cait')?.ready).toBe(false);
});

it('Caitlyn : pas depuis la base ; reçoit les dégâts de combat en dernier', () => {
  expect(act(scenario('base-a'), shoot).ok).toBe(false);
  expect(caitlyn.backline).toBe(true);
});
