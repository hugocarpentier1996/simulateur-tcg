import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { monasteryOfHirana, stupefy } from '../../game-data/src/index.js';

function conquer(buffed: boolean) {
  let s = spellScenario(stupefy);
  s.battlefieldDefinitions = [monasteryOfHirana];
  s.battlefields[1] = {
    ...s.battlefields[1]!,
    controllerId: null,
    definitionId: monasteryOfHirana.id,
  };
  s.units = [
    { ...s.units[0]!, zoneId: 'base-a', ...(buffed ? { buffed: true } : {}) },
  ];
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, { type: 'pass', playerId: 'b' });
  return s.stack ? resolveTop(s) : s;
}

it('Monastery of Hirana : conquérir ici dépense un buff allié pour piocher 1', () => {
  const s = conquer(true);
  expect(s.units[0]?.buffed).toBeUndefined();
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
});

it('Monastery of Hirana : sans buff, rien', () => {
  expect(conquer(false).cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe(
    'deck-a',
  );
});
