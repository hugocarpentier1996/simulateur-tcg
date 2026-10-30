import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight } from './index.js';
import { discipline, incinerate } from '../../game-data/src/index.js';

it('Discipline : en réaction, +2 Might jusqu’à la fin du tour puis pioche 1, avant le sort adverse', () => {
  let s = spellScenario(incinerate);
  s.spellDefinitions = [incinerate, discipline];
  s.cards.push({
    id: 'react',
    definitionId: discipline.id,
    ownerId: 'b',
    zoneId: 'hand-b',
  });
  s.resources.b = { energy: 2, power: {} };
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  });
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, {
    type: 'cast-spell',
    playerId: 'b',
    cardId: 'react',
    targetId: 'enemy',
    payment: noRunes,
  });
  s = resolveTop(s);
  expect(effectiveMight(s.units[1]!, s)).toBe(5);
  expect(s.cards.find((c) => c.id === 'draw-b-0')!.zoneId).toBe('hand-b');
  s = resolveTop(s);
  expect(s.units.find((u) => u.id === 'enemy')).toMatchObject({ damage: 2 });
});
