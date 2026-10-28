import { expect, it } from 'vitest';
import {
  flash,
  recruitToken,
  recruitTheVanguard,
} from '../../game-data/src/index.js';
import {
  act,
  getLegalActions,
  type GameState,
  type GameAction,
} from './index.js';

const recruit = recruitToken;
const spell = recruitTheVanguard;
const payment = { energyRunes: [], powerRunes: [] };
const cast: GameAction = {
  type: 'cast-spell',
  playerId: 'a',
  cardId: 'spell',
  targetId: 'a',
  tokenDestinations: ['base-a', 'field', 'field', 'base-a'],
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
    zones: [
      { id: 'field', kind: 'battlefield' },
      { id: 'enemy-field', kind: 'battlefield' },
      ...['a', 'b'].flatMap((ownerId) =>
        (['base', 'hand', 'graveyard'] as const).map((kind) => ({
          id: `${kind}-${ownerId}`,
          kind,
          ownerId,
        })),
      ),
    ],
    cards: [
      { id: 'spell', definitionId: spell.id, ownerId: 'a', zoneId: 'hand-a' },
      { id: 'flash', definitionId: flash.id, ownerId: 'a', zoneId: 'hand-a' },
    ],
    units: [
      {
        id: 'guard',
        definitionId: 'guard',
        ownerId: 'a',
        zoneId: 'field',
        ready: true,
        might: 3,
        damage: 0,
      },
    ],
    unitDefinitions: [recruit],
    spellDefinitions: [spell, flash],
    resources: { a: { energy: 8, power: {} } },
    battlefields: [
      { zoneId: 'field', controllerId: 'a' },
      { zoneId: 'enemy-field', controllerId: 'b' },
    ],
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
it('invoque quatre Recrues Tap de Might 1 aux destinations annoncées, après les réactions', () => {
  const s = fixture();
  let next = step(s, cast);
  expect(next.units).toHaveLength(1);
  expect(next.resources.a!.energy).toBe(2);
  next = resolve(next);
  const tokens = next.units.filter((u) => u.token);
  expect(tokens.map((u) => u.zoneId)).toEqual([
    'base-a',
    'field',
    'field',
    'base-a',
  ]);
  expect(tokens.every((u) => u.might === 1 && !u.ready && u.damage === 0)).toBe(
    true,
  );
  expect(new Set(tokens.map((u) => u.id)).size).toBe(4);
  expect(next.cards.find((c) => c.id === 'spell')!.zoneId).toBe('graveyard-a');
  expect(s.units).toHaveLength(1);
});
it('refuse un nombre incorrect ou une destination non contrôlée, sans payer', () => {
  const s = fixture();
  for (const tokenDestinations of [
    [],
    ['base-a'],
    ['base-a', 'base-a', 'base-a', 'enemy-field'],
    ['base-a', 'base-a', 'base-a', 'base-b'],
  ])
    expect(act(s, { ...cast, tokenDestinations }).ok).toBe(false);
  expect(s.resources.a!.energy).toBe(8);
});
it('les actions légales proposent les répartitions et le sort reste une Action, pas une Réaction', () => {
  const s = fixture();
  expect(getLegalActions(s, 'a')).toContainEqual(cast);
  s.stack = {
    entries: [],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  expect(act(s, cast)).toEqual({ ok: false, reason: 'SPELL_WINDOW_CLOSED' });
});
it('une réponse Flash fait perdre le contrôle : les invocations prévues sur ce champ sont ignorées', () => {
  let s = step(fixture(), cast);
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'flash',
    targetId: 'a',
    selectedUnitIds: ['guard'],
    payment,
  });
  s = resolve(resolve(s));
  expect(s.units.filter((u) => u.token).map((u) => u.zoneId)).toEqual([
    'base-a',
    'base-a',
  ]);
});
it('copie les destinations ; les identifiants évitent les collisions ; les jetons morts disparaissent', () => {
  const s = fixture();
  s.cards.push({
    id: 'token:1',
    definitionId: 'placeholder',
    ownerId: 'b',
    zoneId: 'hand-b',
  });
  const destinations = ['base-a', 'base-a', 'base-a', 'base-a'];
  let next = step(s, { ...cast, tokenDestinations: destinations });
  destinations[0] = 'enemy-field';
  next = resolve(next);
  expect(next.units.filter((u) => u.token).map((u) => u.id)).toEqual([
    'token:2',
    'token:3',
    'token:4',
    'token:5',
  ]);
  next.units.find((u) => u.id === 'token:2')!.damage = 1;
  next = step(next, { type: 'pass', playerId: 'b' });
  expect(next.units.some((u) => u.id === 'token:2')).toBe(false);
  expect(next.cards.some((c) => c.id === 'token:2')).toBe(false);
});

it('le défenseur peut invoquer sur son champ pendant un Showdown sans provoquer de conquête', () => {
  const s = fixture();
  s.activePlayerId = 'b';
  s.units = [];
  s.showdown = {
    kind: 'combat',
    battlefieldId: 'field',
    initiatorId: 'b',
    defenderId: 'a',
    participants: ['b', 'a'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
    stage: 'priority',
    assignments: {},
  };
  const next = resolve(
    step(s, {
      ...cast,
      tokenDestinations: ['field', 'field', 'field', 'field'],
    }),
  );
  expect(next.units.filter((u) => u.token)).toHaveLength(4);
  expect(
    next.battlefields.find((f) => f.zoneId === 'field')!.controllerId,
  ).toBe('a');
  expect(next.players.map((p) => p.score)).toEqual([0, 0]);
  expect(next.showdown?.kind).toBe('combat');
});
