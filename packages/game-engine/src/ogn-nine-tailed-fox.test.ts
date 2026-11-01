import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { nineTailedFox, stupefy } from '../../game-data/src/index.js';

function scenario(might: number) {
  const s = spellScenario(stupefy);
  s.legendDefinitions = [nineTailedFox];
  s.zones.push({ id: 'legend-b', kind: 'legend', ownerId: 'b' });
  s.cards.push({
    id: 'fox',
    definitionId: nineTailedFox.id,
    ownerId: 'b',
    zoneId: 'legend-b',
    ready: true,
  });
  s.units[0] = { ...s.units[0]!, zoneId: 'base-a', might };
  return step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
}

it('Nine-Tailed Fox : un attaquant ennemi sur un champ contrôlé a -1 Might ce tour', () => {
  const s = scenario(4);
  expect(s.stack?.entries.at(-1)).toMatchObject({
    kind: 'attack',
    sourceId: 'fox',
  });
  const after = resolveTop(s);
  expect(effectiveMight(after.units[0]!, after)).toBe(3);
});

it('Nine-Tailed Fox : minimum 1', () => {
  const after = resolveTop(scenario(1));
  expect(effectiveMight(after.units[0]!, after)).toBe(1);
});
