import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { ahri, stupefy } from '../../game-data/src/index.js';
import type { GameState } from './types.js';

const choose = (s: GameState, playerId: string, targetId: string) =>
  step(s, {
    type: 'choose-attack-targets',
    playerId,
    effects: [
      {
        sourceId: 'ally',
        targetId,
        payment: { energyRunes: [], powerRunes: [] },
      },
    ],
  });
function scenario() {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [ahri];
  s.units[0] = { ...s.units[0]!, definitionId: ahri.id, might: 3 };
  s.units[1] = { ...s.units[1]!, might: 2 };
  return s;
}

it('Ahri : en attaquant, -2 Might à un ennemi ici, minimum 1', () => {
  let s = scenario();
  s.units[0] = { ...s.units[0]!, zoneId: 'base-a' };
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
  s = resolveTop(choose(s, 'a', 'enemy'));
  expect(
    effectiveMight(
      s.units.find((u) => u.id === 'enemy')!,
      s,
    ),
  ).toBe(1);
});

it('Ahri : en défendant aussi', () => {
  let s = scenario();
  s.activePlayerId = 'b';
  s.units[1] = { ...s.units[1]!, zoneId: 'base-b', might: 6 };
  s = step(s, {
    type: 'move',
    playerId: 'b',
    unitId: 'enemy',
    destinationId: 'f',
  });
  expect(s.pendingAttackChoices?.[0]).toMatchObject({ ownerId: 'a' });
  s = resolveTop(choose(s, 'a', 'enemy'));
  expect(
    effectiveMight(
      s.units.find((u) => u.id === 'enemy')!,
      s,
    ),
  ).toBe(4);
});
