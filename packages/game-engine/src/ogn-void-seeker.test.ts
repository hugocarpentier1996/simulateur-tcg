import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { voidSeeker } from '../../game-data/src/index.js';

it('Void Seeker : 4 dégâts à une unité sur un champ, puis le lanceur pioche 1', () => {
  let s = spellScenario(voidSeeker);
  s.resources.a = { energy: 3, power: { rouge: 1 } };
  s.units[1]!.might = 5;
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  });
  s = resolveTop(s);
  expect(s.units.find((u) => u.id === 'enemy')!.damage).toBe(4);
  expect(s.cards.find((c) => c.id === 'draw-a-0')!.zoneId).toBe('hand-a');
  expect(s.cards.find((c) => c.id === 'draw-a-1')!.zoneId).toBe('deck-a');
});

it('Void Seeker pioche aussi quand la cible meurt', () => {
  let s = spellScenario(voidSeeker);
  s.resources.a = { energy: 3, power: { rouge: 1 } };
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  });
  s = resolveTop(s);
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(s.cards.find((c) => c.id === 'draw-a-0')!.zoneId).toBe('hand-a');
});
