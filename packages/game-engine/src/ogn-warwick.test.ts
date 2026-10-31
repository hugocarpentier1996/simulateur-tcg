import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { stupefy, warwick } from '../../game-data/src/index.js';

it('Warwick arrive Ready', () => {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [warwick];
  s.cards.push({
    id: 'ww',
    definitionId: warwick.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 6, power: { orange: 1 } };
  const next = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'ww',
    payment: { energyRunes: [], powerRunes: [] },
  });
  expect(next.units.find((u) => u.id === 'ww')).toMatchObject({
    ready: true,
    might: 5,
  });
});

it('Warwick : en attaquant, tue toutes les unités ennemies blessées du champ', () => {
  let s = spellScenario(stupefy);
  s.unitDefinitions = [warwick];
  s.units = s.units.map((u) =>
    u.id === 'ally'
      ? { ...u, definitionId: warwick.id, zoneId: 'base-a', might: 5 }
      : { ...u, damage: 1, might: 9 },
  );
  s.units.push({ ...s.units[1]!, id: 'healthy', damage: 0 });
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
  s = resolveTop(s);
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(s.units.some((u) => u.id === 'healthy')).toBe(true);
});
