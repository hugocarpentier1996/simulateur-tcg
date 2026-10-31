import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { zaunWarrens, stupefy } from '../../game-data/src/index.js';

it('Zaun Warrens : conquérir ici fait défausser 1 puis piocher 1', () => {
  let s = spellScenario(stupefy);
  s.battlefieldDefinitions = [zaunWarrens];
  s.battlefields[1] = {
    ...s.battlefields[1]!,
    controllerId: null,
    definitionId: zaunWarrens.id,
  };
  s.units = [{ ...s.units[0]!, zoneId: 'base-a' }];
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, { type: 'pass', playerId: 'b' });
  expect(s.players[0]!.score).toBe(1);
  s = resolveTop(s);
  expect(s.pendingDiscard).toMatchObject({ playerId: 'a' });
  s = step(s, { type: 'choose-discard', playerId: 'a', cardId: 'spell' });
  expect(s.cards.find((c) => c.id === 'spell')?.zoneId).toBe('graveyard-a');
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
});
