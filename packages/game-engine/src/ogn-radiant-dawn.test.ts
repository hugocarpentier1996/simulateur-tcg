import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
  drain,
} from './origins-test-fixtures.js';
import { radiantDawn, zenithBlade } from '../../game-data/src/index.js';

it('Radiant Dawn : étourdir un ennemi buffe une unité alliée', () => {
  let s = spellScenario(zenithBlade);
  s.legendDefinitions = [radiantDawn];
  s.zones.push({ id: 'legend-a', kind: 'legend', ownerId: 'a' });
  s.cards.push({
    id: 'dawn',
    definitionId: radiantDawn.id,
    ownerId: 'a',
    zoneId: 'legend-a',
    ready: true,
  });
  s.resources.a = { energy: 3, power: { vert: 2 } };
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(s.stack?.entries).toHaveLength(1);
  s = drain(s);
  expect(s.units.find((u) => u.id === 'ally')?.buffed).toBe(true);
});
