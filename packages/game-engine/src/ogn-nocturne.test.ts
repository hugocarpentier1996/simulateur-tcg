import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { nocturne, mysticPoro, stupefy } from '../../game-data/src/index.js';

it('Nocturne : vue au sommet du deck par une Vision, il peut être joué pour 1 Power', () => {
  const s0 = spellScenario(stupefy);
  s0.unitDefinitions = [nocturne, mysticPoro];
  s0.cards = s0.cards.filter((c) => c.zoneId !== 'deck-a');
  s0.cards.push(
    {
      id: 'scout',
      definitionId: mysticPoro.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    },
    { id: 'noc', definitionId: nocturne.id, ownerId: 'a', zoneId: 'deck-a' },
  );
  s0.resources.a = {
    energy: 10,
    power: { orange: 1, violet: 1, vert: 1, bleu: 2, rouge: 1, jaune: 1 },
  };
  let s = resolveTop(
    step(s0, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'scout',
      payment: noRunes,
    }),
  );
  expect(s.pendingVision?.cardId).toBe('noc');
  s = step(s, { type: 'choose-vision', playerId: 'a', recycle: false });
  while (s.stack && !s.pendingModeChoice) s = resolveTop(s);
  expect(s.pendingModeChoice?.modes).toEqual(['skip', 'pay-play']);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'pay-play' });
  expect(s.units.find((u) => u.id === 'noc')?.zoneId).toBe('base-a');
});
