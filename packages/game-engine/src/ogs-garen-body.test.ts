import { expect, it } from 'vitest';
import { garenBody } from '../../game-data/src/ogs/garen-body.js';
import {
  act,
  effectiveMight,
  type GameState,
  type GameAction,
} from './index.js';

function fixture(ownerId: string): GameState {
  return {
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    unitDefinitions: [garenBody],
    zones: [
      { id: 'field', kind: 'battlefield' },
      ...['a', 'b'].flatMap((id) => [
        { id: `base-${id}`, kind: 'base' as const, ownerId: id },
        { id: `grave-${id}`, kind: 'graveyard' as const, ownerId: id },
      ]),
    ],
    units: [
      {
        id: 'garen',
        definitionId: garenBody.id,
        ownerId,
        zoneId: 'field',
        ready: false,
        might: 5,
        damage: 0,
      },
      {
        id: 'enemy',
        definitionId: 'fixture',
        ownerId: ownerId === 'a' ? 'b' : 'a',
        zoneId: 'field',
        ready: false,
        might: 6,
        damage: 0,
      },
    ],
    cards: [],
    resources: {},
    scoredBattlefields: {},
    battlefields: [{ zoneId: 'field', controllerId: 'b' }],
    showdown: {
      kind: 'combat',
      battlefieldId: 'field',
      initiatorId: 'a',
      defenderId: 'b',
      participants: ['a', 'b'],
      priorityPlayerId: 'a',
      consecutivePasses: 0,
      stage: 'priority',
      assignments: {},
    },
  };
}
function step(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}

it.each(['a', 'b'])(
  'Garen reçoit exactement +2 dans son rôle de combat (%s), survit et perd son bonus à la fin',
  (ownerId) => {
    let s = fixture(ownerId);
    expect(effectiveMight(s.units[0]!, s)).toBe(7);
    if (s.showdown?.kind !== 'combat') throw new Error('Fixture');
    expect(
      effectiveMight(s.units[0]!, {
        ...s,
        showdown: { ...s.showdown, stage: 'effects' },
      }),
    ).toBe(7);
    s = step(s, { type: 'pass', playerId: 'a' });
    s = step(s, { type: 'pass', playerId: 'b' });
    const enemy = ownerId === 'a' ? 'b' : 'a';
    s = step(s, {
      type: 'assign-damage',
      playerId: ownerId,
      allocations: [{ targetId: 'enemy', amount: 6 }],
    });
    s = step(s, {
      type: 'assign-damage',
      playerId: enemy,
      allocations: [{ targetId: 'garen', amount: 6 }],
    });
    expect(s.units).toHaveLength(1);
    expect(s.units[0]).toMatchObject({ id: 'garen', damage: 0 });
    expect(effectiveMight(s.units[0]!, s)).toBe(5);
    expect(s.players[0]!.score).toBe(ownerId === 'a' ? 1 : 0);
  },
);

it('Assault et Shield ne s’additionnent pas et ne fonctionnent ni en Open ni ailleurs', () => {
  const s = fixture('a');
  const u = s.units[0]!;
  expect(effectiveMight(u, { ...s, showdown: null })).toBe(5);
  expect(effectiveMight({ ...u, zoneId: 'base-a' }, s)).toBe(5);
  expect(effectiveMight({ ...u, ownerId: 'spectator' }, s)).toBe(5);
  expect(
    effectiveMight(u, {
      ...s,
      showdown: {
        kind: 'open',
        battlefieldId: 'field',
        initiatorId: 'a',
        participants: ['a', 'b'],
        priorityPlayerId: 'a',
        consecutivePasses: 0,
      },
    }),
  ).toBe(5);
});

it('se joue Tap pour 6 énergie et 1 Power orange avec 5 Might hors combat', () => {
  const s = fixture('a');
  s.showdown = null;
  s.units = [];
  s.zones.push({ id: 'hand', kind: 'hand', ownerId: 'a' });
  s.cards.push({
    id: 'card',
    definitionId: garenBody.id,
    ownerId: 'a',
    zoneId: 'hand',
  });
  s.resources.a = { energy: 6, power: { orange: 1 } };
  const played = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'card',
    payment: { energyRunes: [], powerRunes: [] },
  });
  expect(played.units[0]).toMatchObject({ ready: false, might: 5 });
  expect(played.resources.a).toEqual({ energy: 0, power: { orange: 0 } });
});
