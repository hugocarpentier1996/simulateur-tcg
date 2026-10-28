import { expect, it } from 'vitest';
import { act, type GameState, type GameAction } from './index.js';
import {
  flash,
  decisiveStrike,
  ladyOfLuminosity,
} from '../../game-data/src/index.js';
const legend = ladyOfLuminosity;
const payment = { energyRunes: [], powerRunes: [] };
const cast: GameAction = {
  type: 'cast-spell',
  playerId: 'a',
  cardId: 'spell',
  targetId: 'a',
  payment,
};
function fixture(): GameState {
  return {
    activePlayerId: 'a',
    phase: 'main',
    showdown: null,
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    units: [],
    resources: { a: { energy: 10, power: { jaune: 1 } } },
    battlefields: [],
    scoredBattlefields: {},
    zones: ['a', 'b'].flatMap((ownerId) =>
      (['legend', 'hand', 'deck', 'graveyard', 'base'] as const).map(
        (kind) => ({ id: `${kind}-${ownerId}`, ownerId, kind }),
      ),
    ),
    cards: [
      {
        id: 'legend',
        definitionId: legend.id,
        ownerId: 'a',
        zoneId: 'legend-a',
        ready: false,
      },
      {
        id: 'spell',
        definitionId: decisiveStrike.id,
        ownerId: 'a',
        zoneId: 'hand-a',
      },
      { id: 'flash', definitionId: flash.id, ownerId: 'a', zoneId: 'hand-a' },
      { id: 'drawn', definitionId: 'test', ownerId: 'a', zoneId: 'deck-a' },
    ],
    legendDefinitions: [legend],
    spellDefinitions: [decisiveStrike, flash],
  };
}
function step(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}
function resolve(s: GameState) {
  s = step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId });
  return step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId });
}
it('empile la pioche avant le sort, permet une réaction, et ne repioche pas à la résolution du sort', () => {
  let s = step(fixture(), cast);
  expect(s.stack!.entries).toHaveLength(2);
  expect(s.cards.find((c) => c.id === 'drawn')!.zoneId).toBe('deck-a');
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'flash',
    targetId: 'a',
    selectedUnitIds: [],
    payment,
  });
  s = resolve(s);
  expect(s.cards.find((c) => c.id === 'drawn')!.zoneId).toBe('deck-a');
  s = resolve(s);
  expect(s.cards.find((c) => c.id === 'drawn')!.zoneId).toBe('hand-a');
  s = resolve(s);
  expect(s.result).toBeUndefined();
});
it('ignore les sorts de coût inférieur à 5 et les sorts adverses', () => {
  const s = fixture();
  expect(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'flash',
      targetId: 'a',
      selectedUnitIds: [],
      payment,
    }).stack!.entries,
  ).toHaveLength(1);
  s.cards[0]!.ownerId = 'b';
  s.cards[0]!.zoneId = 'legend-b';
  expect(step(s, cast).stack!.entries).toHaveLength(1);
});
it('une pioche de légende applique la défaite par épuisement sans résoudre le sort restant', () => {
  const s = fixture();
  s.cards = s.cards.filter((c) => c.id !== 'drawn');
  const next = resolve(step(s, cast));
  expect(next.result).toMatchObject({
    winnerId: 'b',
    reason: 'DECK_EXHAUSTION',
  });
  expect(next.stack!.entries).toHaveLength(1);
});
