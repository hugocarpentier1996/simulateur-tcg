import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { isStunned } from './effects/modifiers.js';
import { solariShieldbearer, flash } from '../../game-data/src/index.js';

it('Solari Shieldbearer : Stun de l’unité choisie à la mise en jeu, jusqu’à la fin du tour', () => {
  let s = spellScenario(flash);
  s.unitDefinitions = [solariShieldbearer];
  s.cards.push({
    id: 'sb',
    definitionId: solariShieldbearer.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 3, power: {} };
  s.units[1]!.zoneId = 'base-b';
  s = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'sb',
    onPlayTargetId: 'enemy',
    payment: { energyRunes: [], powerRunes: [] },
  });
  expect(s.units.find((u) => u.id === 'sb')).toMatchObject({ might: 2 });
  s = resolveTop(s);
  expect(isStunned(s.units.find((u) => u.id === 'enemy')!)).toBe(true);
  s = step(s, { type: 'end-turn', playerId: 'a' });
  expect(isStunned(s.units.find((u) => u.id === 'enemy')!)).toBe(false);
});
