import { expect, it } from 'vitest';
import { flash, annieChaos } from '../../game-data/src/index.js';
import {
  act,
  getLegalActions,
  type GameState,
  type GameAction,
} from './index.js';

const annie = annieChaos;
const payment = { energyRunes: [], powerRunes: [] };
const play: GameAction = {
  type: 'play-unit',
  playerId: 'a',
  cardId: 'annie',
  returnSpellId: 'old',
  payment,
};
function fixture(): GameState {
  return {
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    showdown: null,
    zones: ['a', 'b'].flatMap((ownerId) =>
      (['hand', 'base', 'graveyard', 'champion'] as const).map((kind) => ({
        id: `${kind}-${ownerId}`,
        kind,
        ownerId,
      })),
    ),
    cards: [
      { id: 'annie', definitionId: annie.id, ownerId: 'a', zoneId: 'hand-a' },
      {
        id: 'old',
        definitionId: flash.id,
        ownerId: 'a',
        zoneId: 'graveyard-a',
      },
      {
        id: 'response',
        definitionId: flash.id,
        ownerId: 'a',
        zoneId: 'hand-a',
      },
    ],
    units: [],
    unitDefinitions: [annie],
    spellDefinitions: [flash],
    resources: { a: { energy: 6, power: { violet: 1 } } },
    battlefields: [],
    scoredBattlefields: {},
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
it('pose Annie Tap puis récupère le sort choisi après une fenêtre de réaction', () => {
  const s = fixture();
  let next = step(s, play);
  expect(next.units[0]).toMatchObject({ might: 3, ready: false });
  expect(next.resources.a).toEqual({ energy: 2, power: { violet: 0 } });
  expect(next.stack?.entries).toHaveLength(1);
  expect(next.cards.find((c) => c.id === 'old')!.zoneId).toBe('graveyard-a');
  next = step(next, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'response',
    targetId: 'a',
    selectedUnitIds: [],
    payment,
  });
  next = resolve(resolve(next));
  expect(next.cards.find((c) => c.id === 'old')!.zoneId).toBe('hand-a');
  expect(next.cards.find((c) => c.id === 'response')!.zoneId).toBe(
    'graveyard-a',
  );
  expect(s.cards.find((c) => c.id === 'old')!.zoneId).toBe('graveyard-a');
});
it('refuse un choix absent ou invalide sans payer ; énumère les sorts récupérables', () => {
  const s = fixture();
  expect(
    act(s, { type: 'play-unit', playerId: 'a', cardId: 'annie', payment }).ok,
  ).toBe(false);
  for (const id of ['annie', 'response', 'missing'])
    expect(act(s, { ...play, returnSpellId: id }).ok).toBe(false);
  expect(
    getLegalActions(s, 'a').filter((a) => a.type === 'play-unit'),
  ).toContainEqual({ ...play, destinationId: 'base-a' });
  s.cards[1]!.ownerId = 'b';
  s.cards[1]!.zoneId = 'graveyard-b';
  expect(act(s, play).ok).toBe(false);
});
it('reste jouable sans sort au cimetière, y compris depuis la zone champion', () => {
  const s = fixture();
  s.cards = s.cards.filter((c) => c.id !== 'old');
  s.cards[0]!.zoneId = 'champion-a';
  const next = resolve(
    step(s, { type: 'play-unit', playerId: 'a', cardId: 'annie', payment }),
  );
  expect(next.units[0]!.id).toBe('annie');
  expect(next.cards.some((c) => c.zoneId === 'hand-a')).toBe(true);
});
it('la disparition de la cible ne récupère aucun autre sort ; la source peut disparaître', () => {
  let s = step(fixture(), play);
  s.units = [];
  expect(resolve(s).cards.find((c) => c.id === 'old')!.zoneId).toBe('hand-a');
  s = step(fixture(), play);
  s.cards = s.cards.filter((c) => c.id !== 'old');
  expect(resolve(s).cards.find((c) => c.id === 'response')!.zoneId).toBe(
    'hand-a',
  );
});
