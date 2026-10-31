import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { zauniteBouncer, flash } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(flash);
  s.unitDefinitions = [zauniteBouncer];
  s.cards.push({
    id: 'zb',
    definitionId: zauniteBouncer.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 4, power: { violet: 2 } };
  s.units.push({ ...s.units[1]!, id: 'home', zoneId: 'base-b' });
  return s;
}

it('Zaunite Bouncer : vise une autre unité sur un champ, alliée ou ennemie, jamais lui-même', () => {
  const targets = getLegalActions(scenario(), 'a')
    .filter((a) => a.type === 'play-unit' && a.cardId === 'zb')
    .map((a) => (a.type === 'play-unit' ? a.onPlayTargetId : null));
  expect(new Set(targets)).toEqual(new Set(['ally', 'enemy']));
});

it('Zaunite Bouncer renvoie la cible dans la main de son propriétaire', () => {
  const s = resolveTop(
    step(scenario(), {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'zb',
      destinationId: 'f',
      onPlayTargetId: 'enemy',
      payment: { energyRunes: [], powerRunes: [] },
    }),
  );
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(s.cards.find((c) => c.id === 'enemy')?.zoneId).toBe('hand-b');
});
