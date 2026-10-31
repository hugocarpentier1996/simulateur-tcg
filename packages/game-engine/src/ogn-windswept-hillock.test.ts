import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { act } from './index.js';
import { windsweptHillock, mobilize } from '../../game-data/src/index.js';

it('Windswept Hillock : les unités présentes ont Ganking', () => {
  const s = spellScenario(mobilize);
  s.battlefieldDefinitions = [windsweptHillock];
  s.units = s.units.filter((u) => u.id !== 'enemy');
  s.battlefields = s.battlefields.map((f) => ({ ...f, controllerId: 'a' }));
  const gank = {
    type: 'move' as const,
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  };
  expect(act(s, gank).ok).toBe(false);
  s.battlefields[0]!.definitionId = windsweptHillock.id;
  expect(act(s, gank).ok).toBe(true);
});
