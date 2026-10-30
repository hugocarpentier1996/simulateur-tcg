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
it('ne pioche qu’une fois le sort résolu, via un déclenchement qui ouvre sa fenêtre', () => {
  let s = step(fixture(), cast);
  expect(s.stack!.entries).toHaveLength(1);
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'flash',
    targetId: 'a',
    selectedUnitIds: [],
    payment,
  });
  expect(s.stack!.entries).toHaveLength(2);
  s = resolve(s);
  expect(s.stack!.entries).toHaveLength(1);
  expect(s.cards.find((c) => c.id === 'drawn')!.zoneId).toBe('deck-a');
  s = resolve(s);
  expect(s.stack!.entries).toHaveLength(1);
  expect(s.stack!.entries[0]).toMatchObject({ kind: 'legend-draw' });
  expect(s.cards.find((c) => c.id === 'drawn')!.zoneId).toBe('deck-a');
  s = resolve(s);
  expect(s.cards.find((c) => c.id === 'drawn')!.zoneId).toBe('hand-a');
  expect(s.stack).toBeNull();
  expect(s.result).toBeUndefined();
});
it('ne pioche pas tant que le sort reste sur la pile', () => {
  const s = step(fixture(), cast);
  expect(s.stack!.entries.some((e) => 'kind' in e)).toBe(false);
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
it('pioche sur deck vide après le sort : recycle la défausse, sort compris, et pénalise', () => {
  const s = fixture();
  s.cards = s.cards.filter((c) => c.id !== 'drawn');
  const played = resolve(step(s, cast));
  expect(played.result).toBeUndefined();
  const next = resolve(played);
  expect(next.result).toBeUndefined();
  expect(next.players.find((p) => p.id === 'b')!.score).toBe(1);
  expect(next.cards.find((c) => c.id === 'spell')!.zoneId).toBe('hand-a');
});
it('pioche sur deck et défausse vides : défaite par épuisement', () => {
  const s = fixture();
  s.cards = s.cards.filter((c) => c.id !== 'drawn');
  const played = resolve(step(s, cast));
  played.cards = played.cards.filter((c) => c.zoneId !== 'graveyard-a');
  expect(resolve(played).result).toMatchObject({
    winnerId: 'b',
    reason: 'DECK_EXHAUSTION',
  });
});
