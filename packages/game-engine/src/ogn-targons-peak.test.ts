import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { targonsPeak, stupefy } from '../../game-data/src/index.js';

it('Targon’s Peak : conquérir ici redresse 2 runes à la fin du tour', () => {
  let s = spellScenario(stupefy);
  s.battlefieldDefinitions = [targonsPeak];
  s.battlefields[1] = {
    ...s.battlefields[1]!,
    controllerId: null,
    definitionId: targonsPeak.id,
  };
  s.units = [{ ...s.units[0]!, zoneId: 'base-a' }];
  for (let i = 0; i < 3; i++)
    s.cards.push({
      id: `r${i}`,
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'runes-a',
      color: 'vert',
      ready: false,
    });
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, { type: 'pass', playerId: 'b' });
  expect(s.endTurnReadyRunes).toEqual({ a: 2 });
  s = step(s, { type: 'end-turn', playerId: 'a' });
  s = resolveTop(s);
  expect(s.cards.filter((c) => c.zoneId === 'runes-a' && c.ready)).toHaveLength(
    2,
  );
  expect(s.endTurnReadyRunes ?? {}).toEqual({});
});
