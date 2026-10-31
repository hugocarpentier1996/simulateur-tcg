import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { isStunned } from './effects/modifiers.js';
import { leonaOrder, stupefy } from '../../game-data/src/index.js';

it('Leona : en attaquant, choisit une unité ennemie ici et la Stun après réactions', () => {
  let s = spellScenario(stupefy);
  s.unitDefinitions = [leonaOrder];
  s.units[0] = {
    ...s.units[0]!,
    definitionId: leonaOrder.id,
    zoneId: 'base-a',
    might: 4,
  };
  s.units.push({ ...s.units[1]!, id: 'other' });
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
  expect(s.pendingAttackChoices).toHaveLength(1);
  const choices = getLegalActions(s, 'a').filter(
    (a) => a.type === 'choose-attack-targets',
  );
  expect(choices).toHaveLength(2);
  s = step(s, {
    type: 'choose-attack-targets',
    playerId: 'a',
    effects: [
      {
        sourceId: 'ally',
        targetId: 'other',
        payment: { energyRunes: [], powerRunes: [] },
      },
    ],
  });
  expect(isStunned(s.units.find((u) => u.id === 'other')!)).toBe(false);
  s = resolveTop(s);
  expect(isStunned(s.units.find((u) => u.id === 'other')!)).toBe(true);
  expect(isStunned(s.units.find((u) => u.id === 'enemy')!)).toBe(false);
});
