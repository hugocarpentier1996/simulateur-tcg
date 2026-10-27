import { expect, it } from 'vitest';
import {
  blastOfPower,
  highlander,
  deathTestUnits,
} from '../../game-data/src/index.js';
import { act, type GameState, type GameAction } from './index.js';

function fixture(): GameState {
  return {
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    zones: [
      { id: 'field', kind: 'battlefield' },
      ...['a', 'b'].flatMap((ownerId) =>
        (['base', 'hand', 'graveyard'] as const).map((kind) => ({
          id: `${kind}-${ownerId}`,
          kind,
          ownerId,
        })),
      ),
    ],
    spellDefinitions: [blastOfPower, highlander],
    unitDefinitions: deathTestUnits,
    cards: [
      {
        id: 'blast',
        definitionId: blastOfPower.id,
        ownerId: 'a',
        zoneId: 'hand-a',
      },
      {
        id: 'highlander',
        definitionId: highlander.id,
        ownerId: 'b',
        zoneId: 'hand-b',
      },
    ],
    units: [
      {
        id: 'target',
        definitionId: 'fixture',
        ownerId: 'b',
        zoneId: 'field',
        ready: true,
        might: 100,
        damage: 0,
      },
      {
        id: 'other',
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'base-a',
        ready: false,
        might: 3,
        damage: 1,
      },
    ],
    resources: {
      a: { energy: 6, power: { jaune: 1 } },
      b: { energy: 4, power: {} },
    },
    battlefields: [{ zoneId: 'field', controllerId: 'b' }],
    scoredBattlefields: {},
    showdown: null,
  };
}
const cast: Extract<GameAction, { type: 'cast-spell' }> = {
  type: 'cast-spell',
  playerId: 'a',
  cardId: 'blast',
  targetId: 'target',
  payment: { energyRunes: [], powerRunes: [] },
};
function step(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r;
}
function resolve(s: GameState) {
  s = step(s, { type: 'pass', playerId: 'a' }).state;
  return step(s, { type: 'pass', playerId: 'b' });
}

it.each([0, 100])(
  'tue une unité de %i Might sans dégâts ni soin global après paiement',
  (might) => {
    const s = fixture();
    s.units[0]!.might = might;
    const paid = step(s, cast).state;
    expect(paid.resources.a).toEqual({ energy: 0, power: { jaune: 0 } });
    expect(paid.units).toHaveLength(2);
    const r = resolve(paid);
    expect(r.state.units).toHaveLength(1);
    expect(r.state.units[0]).toMatchObject({ id: 'other', damage: 1 });
    expect(r.state.cards.find((c) => c.id === 'target')?.zoneId).toBe(
      'graveyard-b',
    );
    expect(
      r.events.some(
        (e) =>
          e.type === 'spell-damage' ||
          e.type === 'unit-damage' ||
          e.type === 'combat-damage',
      ),
    ).toBe(false);
  },
);

it('refuse la base et un Power de mauvaise couleur, sans mutation', () => {
  const s = fixture();
  expect(act(s, { ...cast, targetId: 'other' })).toEqual({
    ok: false,
    reason: 'INVALID_TARGET',
  });
  s.resources.a!.power = { rouge: 1 };
  expect(act(s, cast)).toEqual({ ok: false, reason: 'INSUFFICIENT_RESOURCES' });
  expect(s.cards.find((c) => c.id === 'blast')?.zoneId).toBe('hand-a');
});

it('une cible revenue en base pendant les réactions échappe au sort payé', () => {
  const s = step(fixture(), cast).state;
  s.units[0]!.zoneId = 'base-b';
  const r = resolve(s);
  expect(r.state.units).toHaveLength(2);
  expect(r.state.resources.a?.energy).toBe(0);
});

it('Highlander remplace aussi la mort directe et conserve le bonus existant', () => {
  let s = fixture();
  s.units[0]!.damage = 2;
  s.units[0]!.temporaryEffects = [{ type: 'modify-might', amount: 3 }];
  s = step(s, cast).state;
  s = step(s, { type: 'pass', playerId: 'a' }).state;
  s = step(s, {
    type: 'cast-spell',
    playerId: 'b',
    cardId: 'highlander',
    targetId: 'target',
    payment: { energyRunes: [], powerRunes: [] },
  }).state;
  s = resolve(s).state;
  s = resolve(s).state;
  expect(s.units[0]).toMatchObject({
    id: 'target',
    zoneId: 'base-b',
    ready: false,
    damage: 0,
    temporaryEffects: [{ type: 'modify-might', amount: 3 }],
  });
});

it('déclenche la capacité de mort et garde le contrôle du défenseur pendant le showdown', () => {
  const s = fixture();
  s.units[0]!.definitionId = 'reborn';
  s.units[1]!.zoneId = 'field';
  s.showdown = {
    kind: 'combat',
    battlefieldId: 'field',
    initiatorId: 'a',
    defenderId: 'b',
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
    stage: 'priority',
    assignments: {},
  };
  const r = resolve(step(s, cast).state);
  expect(r.state.pendingDeaths?.playerOrder).toEqual(['b']);
  expect(r.state.battlefields[0]?.controllerId).toBe('b');
  expect(r.state.players[0]?.score).toBe(0);
  expect(
    r.events.some(
      (e) => e.type === 'death-triggered' && e.sourceId === 'target',
    ),
  ).toBe(true);
});

it('un jeton détruit disparaît au lieu de rejoindre le cimetière', () => {
  const s = fixture();
  s.units[0]!.token = true;
  const r = resolve(step(s, cast).state);
  expect(r.state.units.some((u) => u.id === 'target')).toBe(false);
  expect(r.state.cards.some((c) => c.id === 'target')).toBe(false);
  expect(r.events.some((e) => e.type === 'token-removed')).toBe(true);
});
