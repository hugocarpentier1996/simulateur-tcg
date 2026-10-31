import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { trifarianGloryseeker, hextechRay } from '../../game-data/src/index.js';
import type { GameState } from './types.js';

function scenario() {
  const s = spellScenario(hextechRay);
  s.unitDefinitions = [trifarianGloryseeker];
  s.cards.push({
    id: 'glory',
    definitionId: trifarianGloryseeker.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 3, power: { rouge: 1 } };
  return s;
}
const play = (s: GameState) =>
  step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'glory',
    payment: noRunes,
  });

it('Trifarian Gloryseeker : Legion — se buffe à la mise en jeu', () => {
  const alone = play(scenario());
  expect(alone.stack ?? null).toBeNull();
  let s = resolveTop(
    step(scenario(), {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  s = resolveTop(play(s));
  expect(s.units.find((u) => u.id === 'glory')?.buffed).toBe(true);
});
