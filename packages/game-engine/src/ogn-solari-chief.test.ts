import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { isStunned } from './effects/modifiers.js';
import { solariChief, flash } from '../../game-data/src/index.js';

function play(stunned: boolean) {
  const s = spellScenario(flash);
  s.unitDefinitions = [solariChief];
  s.cards.push({
    id: 'chief',
    definitionId: solariChief.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 5, power: { jaune: 1 } };
  if (stunned) s.units[1]!.temporaryEffects = [{ type: 'stun' }];
  return resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'chief',
      onPlayTargetId: 'enemy',
      payment: { energyRunes: [], powerRunes: [] },
    }),
  );
}

it('Solari Chief : Stun d’une unité ennemie qui ne l’était pas', () => {
  const s = play(false);
  expect(isStunned(s.units.find((u) => u.id === 'enemy')!)).toBe(true);
});

it('Solari Chief : tue l’unité ennemie déjà Stun', () => {
  expect(play(true).units.some((u) => u.id === 'enemy')).toBe(false);
});
