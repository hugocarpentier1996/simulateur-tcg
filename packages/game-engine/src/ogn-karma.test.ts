import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { karma, stupefy } from '../../game-data/src/index.js';

it('Karma : recycler des cartes (ici par sa Vision) buffe une unité alliée', () => {
  const s0 = spellScenario(stupefy);
  s0.unitDefinitions = [karma];
  s0.cards.push({
    id: 'karma',
    definitionId: karma.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s0.resources.a = { energy: 6, power: { jaune: 1 } };
  let s = resolveTop(
    step(s0, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'karma',
      payment: noRunes,
    }),
  );
  expect(s.pendingVision).toBeTruthy();
  s = step(s, { type: 'choose-vision', playerId: 'a', recycle: true });
  expect(s.units.filter((u) => u.ownerId === 'a' && u.buffed)).toHaveLength(1);
});

it('Karma : garder la carte au sommet ne buffe rien', () => {
  const s0 = spellScenario(stupefy);
  s0.unitDefinitions = [karma];
  s0.cards.push({
    id: 'karma',
    definitionId: karma.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s0.resources.a = { energy: 6, power: { jaune: 1 } };
  let s = resolveTop(
    step(s0, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'karma',
      payment: noRunes,
    }),
  );
  s = step(s, { type: 'choose-vision', playerId: 'a', recycle: false });
  expect(s.units.some((u) => u.buffed)).toBe(false);
});
