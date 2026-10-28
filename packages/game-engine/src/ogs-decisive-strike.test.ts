import { expect, it } from 'vitest';
import { decisiveStrike } from '../../game-data/src/index.js';
import {
  act,
  getLegalActions,
  effectiveMight,
  type GameState,
  type GameAction,
} from './index.js';
import { withDrawSupplies } from './test-fixtures.js';

it('est jouable avec priorité en showdown, mais pas en réaction', () => {
  const s = fixture();
  s.showdown = {
    kind: 'open',
    battlefieldId: 'field',
    initiatorId: 'a',
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  expect(act(s, cast).ok).toBe(true);
  s.stack = {
    entries: [],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  expect(act(s, cast)).toEqual({ ok: false, reason: 'SPELL_WINDOW_CLOSED' });
});

it('peut se résoudre sans unité et refuse un coût incomplet', () => {
  const s = fixture();
  s.units = [];
  expect(resolve(step(s, cast)).units).toEqual([]);
  s.resources.a!.energy = 4;
  expect(act(s, cast)).toEqual({ ok: false, reason: 'INSUFFICIENT_RESOURCES' });
});

function fixture(color = 'orange'): GameState {
  return withDrawSupplies({
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    zones: [
      { id: 'field', kind: 'battlefield' },
      ...['a', 'b'].flatMap((ownerId) =>
        (['base', 'graveyard', 'runes', 'rune-pile'] as const).map((kind) => ({
          id: `${kind}-${ownerId}`,
          kind,
          ownerId,
        })),
      ),
    ],
    spellDefinitions: [decisiveStrike],
    cards: [
      {
        id: 'spell',
        definitionId: decisiveStrike.id,
        ownerId: 'a',
        zoneId: 'hand-a',
      },
      {
        id: 'rune',
        definitionId: 'rune',
        ownerId: 'a',
        zoneId: 'runes-a',
        color,
        ready: false,
      },
    ],
    units: [
      {
        id: 'base',
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'base-a',
        ready: false,
        might: 0,
        damage: 0,
      },
      {
        id: 'field-unit',
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'field',
        ready: true,
        might: 3,
        damage: 0,
      },
      {
        id: 'enemy',
        definitionId: 'fixture',
        ownerId: 'b',
        zoneId: 'base-b',
        ready: true,
        might: 3,
        damage: 0,
      },
    ],
    resources: { a: { energy: 5, power: {} } },
    battlefields: [{ zoneId: 'field', controllerId: 'a' }],
    scoredBattlefields: {},
    showdown: null,
  });
}
const cast: Extract<GameAction, { type: 'cast-spell' }> = {
  type: 'cast-spell',
  playerId: 'a',
  cardId: 'spell',
  targetId: 'a',
  payment: { energyRunes: [], powerRunes: ['rune'] },
};
function step(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}
function resolve(s: GameState) {
  return step(step(s, { type: 'pass', playerId: 'a' }), {
    type: 'pass',
    playerId: 'b',
  });
}

it.each(['orange', 'jaune'])(
  'accepte une rune %s Tap et applique +2 à tous les alliés, puis expire',
  (color) => {
    const initial = fixture(color);
    expect(getLegalActions(initial, 'a')).toContainEqual(cast);
    let s = step(initial, cast);
    expect(s.resources.a).toMatchObject({ energy: 0, power: { [color]: 0 } });
    expect(s.units.map((u) => effectiveMight(u, s))).toEqual([0, 3, 3]);
    s = resolve(s);
    expect(s.units.map((u) => effectiveMight(u, s))).toEqual([2, 5, 3]);
    expect(s.units.map((u) => u.ready)).toEqual([false, true, true]);
    s.priorityPlayerId = 'a';
    s = step(s, { type: 'end-turn', playerId: 'a' });
    expect(s.units.map((u) => effectiveMight(u, s))).toEqual([0, 3, 3]);
  },
);

it('refuse une autre couleur, sans paiement ni action légale', () => {
  const s = fixture('rouge');
  expect(act(s, cast)).toEqual({ ok: false, reason: 'INSUFFICIENT_RESOURCES' });
  expect(getLegalActions(s, 'a').some((a) => a.type === 'cast-spell')).toBe(
    false,
  );
  expect(s.resources.a?.energy).toBe(5);
});

it('accepte du Power flottant jaune sans recycler de rune', () => {
  const s = fixture();
  s.resources.a!.power = { jaune: 1 };
  const played = step(s, {
    ...cast,
    payment: { energyRunes: [], powerRunes: [] },
  });
  expect(played.resources.a?.power.jaune).toBe(0);
  expect(played.cards.find((c) => c.id === 'rune')?.zoneId).toBe('runes-a');
});

it('ne donne le bonus qu’aux alliés présents à la résolution, pas aux arrivants ultérieurs', () => {
  let s = step(fixture(), cast);
  s.units.push({ ...s.units[0]!, id: 'arriving' });
  s = resolve(s);
  expect(effectiveMight(s.units[3]!, s)).toBe(2);
  s.units.push({
    id: 'later',
    definitionId: 'fixture',
    ownerId: 'a',
    zoneId: 'base-a',
    might: 1,
    damage: 0,
    ready: false,
  });
  expect(effectiveMight(s.units[4]!, s)).toBe(1);
});
