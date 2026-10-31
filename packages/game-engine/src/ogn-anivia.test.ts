import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { stupefy } from '../../game-data/src/index.js';
import { anivia } from '../../game-data/src/index.js';
import type { GameState } from './types.js';

function setup(): GameState {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [anivia];
  s.units = s.units.map((u) =>
    u.id === 'ally'
      ? { ...u, definitionId: anivia.id, zoneId: 'base-a', might: 8 }
      : { ...u, might: 5 },
  );
  s.units.push(
    { ...s.units[1]!, id: 'enemy-2', might: 2 },
    { ...s.units[1]!, id: 'elsewhere', zoneId: 'base-b' },
  );
  return s;
}
const attack = {
  type: 'move' as const,
  playerId: 'a',
  unitId: 'ally',
  destinationId: 'g',
};

it('Anivia : en attaquant, 3 dégâts à toutes les unités ennemies ici après réactions', () => {
  let s = step(setup(), attack);
  expect(s.stack?.entries).toHaveLength(1);
  expect(s.units.find((u) => u.id === 'enemy')!.damage).toBe(0);
  s = resolveTop(s);
  expect(s.units.find((u) => u.id === 'enemy')!.damage).toBe(3);
  expect(s.units.some((u) => u.id === 'enemy-2')).toBe(false);
  expect(s.units.find((u) => u.id === 'elsewhere')!.damage).toBe(0);
  expect(s.units.find((u) => u.id === 'ally')!.damage).toBe(0);
});

it('Anivia ne déclenche pas en défense ni sur un champ vide', () => {
  const open = setup();
  open.units = open.units.filter((u) => u.zoneId !== 'g');
  open.battlefields[1]!.controllerId = null;
  expect(step(open, attack).stack ?? undefined).toBeUndefined();
});
