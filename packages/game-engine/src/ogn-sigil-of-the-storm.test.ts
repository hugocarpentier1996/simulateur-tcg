import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { sigilOfTheStorm, stupefy } from '../../game-data/src/index.js';

it('Sigil of the Storm : le conquérant recycle une de ses runes (Tap d’abord)', () => {
  let s = spellScenario(stupefy);
  s.battlefieldDefinitions = [sigilOfTheStorm];
  s.battlefields[1] = {
    ...s.battlefields[1]!,
    controllerId: null,
    definitionId: sigilOfTheStorm.id,
  };
  s.units = [{ ...s.units[0]!, zoneId: 'base-a' }];
  s.cards.push(
    {
      id: 'r-ready',
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'runes-a',
      color: 'vert',
      ready: true,
    },
    {
      id: 'r-tap',
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'runes-a',
      color: 'vert',
      ready: false,
    },
  );
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, { type: 'pass', playerId: 'b' });
  s = resolveTop(s);
  expect(s.cards.find((c) => c.id === 'r-tap')?.zoneId).toBe('rune-pile-a');
  expect(s.cards.find((c) => c.id === 'r-ready')?.zoneId).toBe('runes-a');
});
