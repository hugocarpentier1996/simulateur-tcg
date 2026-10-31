import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { act } from './index.js';
import { buffUnit } from './effects/buff.js';
import { bilgewaterBully, mobilize } from '../../game-data/src/index.js';

it('Bilgewater Bully : Ganking tant qu’il est buffé', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [bilgewaterBully];
  s.units[0] = { ...s.units[0]!, definitionId: bilgewaterBully.id };
  s.units = s.units.filter((u) => u.id !== 'enemy');
  s.battlefields = s.battlefields.map((f) => ({ ...f, controllerId: 'a' }));
  const gank = {
    type: 'move' as const,
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  };
  expect(act(s, gank).ok).toBe(false);
  s = buffUnit(s, 'ally');
  expect(act(s, gank).ok).toBe(true);
});
