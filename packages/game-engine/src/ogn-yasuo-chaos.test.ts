import { expect, it } from 'vitest';
import { spellScenario, step } from './origins-test-fixtures.js';
import { yasuoChaos, mobilize } from '../../game-data/src/index.js';

it('Yasuo (Chaos) : au troisième déplacement du tour, son propriétaire marque 1 point', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [yasuoChaos];
  s.units[0] = {
    ...s.units[0]!,
    definitionId: yasuoChaos.id,
    movesThisTurn: 2,
    zoneId: 'f',
  };
  s.units = s.units.filter((u) => u.id !== 'enemy');
  s.battlefields = s.battlefields.map((f) => ({ ...f, controllerId: 'a' }));
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
  expect(s.players.find((p) => p.id === 'a')?.score).toBe(1);
  s = { ...s, units: s.units.map((u) => ({ ...u, ready: true })) };
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'f',
  });
  expect(s.players.find((p) => p.id === 'a')?.score).toBe(1);
});
