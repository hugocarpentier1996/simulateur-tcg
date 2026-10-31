import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { kaiSaFury, stupefy } from '../../game-data/src/index.js';

it('Kai’Sa : quand elle conquiert, son propriétaire pioche 1 après réactions', () => {
  let s = spellScenario(stupefy);
  s.unitDefinitions = [kaiSaFury];
  s.units = [
    { ...s.units[0]!, definitionId: kaiSaFury.id, zoneId: 'base-a', might: 4 },
  ];
  s.battlefields[1]!.controllerId = null;
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, { type: 'pass', playerId: 'b' });
  expect(s.players[0]!.score).toBe(1);
  expect(s.cards.find((c) => c.id === 'draw-a-0')!.zoneId).toBe('deck-a');
  s = resolveTop(s);
  expect(s.cards.find((c) => c.id === 'draw-a-0')!.zoneId).toBe('hand-a');
});

it('Kai’Sa a Accelerate (Fury)', () => {
  expect(kaiSaFury.accelerate).toEqual({ power: 'rouge' });
});
