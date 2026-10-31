import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { noxusHopeful, hextechRay } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(hextechRay);
  s.unitDefinitions = [noxusHopeful];
  s.cards.push({
    id: 'hopeful',
    definitionId: noxusHopeful.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 3, power: { rouge: 1 } };
  return s;
}
const play = {
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'hopeful',
  payment: noRunes,
};

it('Noxus Hopeful : Legion — coûte 2 énergie de moins si une autre carte a été jouée', () => {
  expect(act(scenario(), play).ok).toBe(false);
  let s = resolveTop(
    step(scenario(), {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(
    getLegalActions(s, 'a').some(
      (a) => a.type === 'play-unit' && a.cardId === 'hopeful',
    ),
  ).toBe(true);
  s = step(s, play);
  expect(s.resources.a?.energy).toBe(0);
});
