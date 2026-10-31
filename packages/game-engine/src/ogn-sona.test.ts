import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { sona, mobilize } from '../../game-data/src/index.js';

function scenario(zoneId: string) {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [sona];
  s.units[0] = { ...s.units[0]!, definitionId: sona.id, zoneId };
  for (let i = 0; i < 5; i++)
    s.cards.push({
      id: `r${i}`,
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'runes-a',
      color: 'vert',
      ready: false,
    });
  return s;
}

it('Sona : sur un champ, redresse 4 runes alliées à la fin du tour', () => {
  let s = step(scenario('f'), { type: 'end-turn', playerId: 'a' });
  expect(s.stack?.entries).toHaveLength(1);
  s = resolveTop(s);
  expect(
    s.cards.filter((c) => c.zoneId === 'runes-a' && c.ready).length,
  ).toBeGreaterThanOrEqual(4);
});

it('Sona : en base, rien', () => {
  const s = step(scenario('base-a'), { type: 'end-turn', playerId: 'a' });
  expect(s.stack ?? null).toBeNull();
  expect(s.activePlayerId).toBe('b');
});
