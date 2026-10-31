import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import {
  vanguardCaptain,
  recruitToken,
  hextechRay,
} from '../../game-data/src/index.js';
import type { GameState } from './types.js';

function scenario() {
  const s = spellScenario(hextechRay);
  s.unitDefinitions = [vanguardCaptain, recruitToken];
  s.cards.push({
    id: 'captain',
    definitionId: vanguardCaptain.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 4, power: { jaune: 1, rouge: 1 } };
  return s;
}
const play = (s: GameState) =>
  step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'captain',
    destinationId: 'f',
    payment: noRunes,
  });
const recruits = (s: GameState) =>
  s.units.filter((u) => u.definitionId === recruitToken.id);

it('Vanguard Captain : sans Legion, aucun jeton', () => {
  const s = play(scenario());
  expect(s.stack ?? null).toBeNull();
  expect(recruits(s)).toHaveLength(0);
});

it('Vanguard Captain : Legion — deux Recrues 1 ici', () => {
  let s = resolveTop(
    step(scenario(), {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  s = play(s);
  while (s.stack) s = resolveTop(s);
  expect(recruits(s).map((u) => u.zoneId)).toEqual(['f', 'f']);
});
