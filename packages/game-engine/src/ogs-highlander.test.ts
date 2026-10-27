import { expect, it } from 'vitest';
import { highlander, deathTestUnits } from '../../game-data/src/index.js';
import { act, type GameState, type GameAction } from './index.js';
import { withDrawSupplies } from './test-fixtures.js';
import { replaceDeaths } from './effects/replace-death.js';

function fixture(): GameState {
  return withDrawSupplies({
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    zones: [
      { id: 'field', kind: 'battlefield' },
      ...['a', 'b'].flatMap((ownerId) => [
        { id: `base-${ownerId}`, kind: 'base' as const, ownerId },
        { id: `grave-${ownerId}`, kind: 'graveyard' as const, ownerId },
      ]),
    ],
    unitDefinitions: deathTestUnits,
    spellDefinitions: [highlander],
    cards: [
      {
        id: 'spell',
        definitionId: highlander.id,
        ownerId: 'a',
        zoneId: 'hand-a',
      },
    ],
    units: [
      {
        id: 'ally',
        definitionId: 'reborn',
        ownerId: 'a',
        zoneId: 'field',
        ready: true,
        might: 1,
        damage: 0,
      },
      {
        id: 'enemy',
        definitionId: 'fixture',
        ownerId: 'b',
        zoneId: 'field',
        ready: true,
        might: 8,
        damage: 0,
      },
    ],
    resources: { a: { energy: 4, power: {} } },
    battlefields: [{ zoneId: 'field', controllerId: 'b' }],
    scoredBattlefields: {},
    showdown: null,
  });
}
function step(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r;
}
const cast = (targetId = 'ally'): GameAction => ({
  type: 'cast-spell',
  playerId: 'a',
  cardId: 'spell',
  targetId,
  payment: { energyRunes: [], powerRunes: [] },
});
function protect(s: GameState) {
  s = step(s, cast()).state;
  s = step(s, { type: 'pass', playerId: 'a' }).state;
  return step(s, { type: 'pass', playerId: 'b' }).state;
}
function fight(s: GameState, defender = 'b') {
  const attacker = defender === 'b' ? 'a' : 'b';
  s = {
    ...s,
    showdown: {
      kind: 'combat',
      battlefieldId: 'field',
      initiatorId: attacker,
      defenderId: defender,
      participants: [attacker, defender],
      priorityPlayerId: attacker,
      consecutivePasses: 0,
      stage: 'priority',
      assignments: {},
    },
    battlefields: [{ zoneId: 'field', controllerId: defender }],
  };
  s = step(s, { type: 'pass', playerId: attacker }).state;
  s = step(s, { type: 'pass', playerId: defender }).state;
  s = step(s, { type: 'assign-damage', playerId: 'a', allocations: [] }).state;
  return step(s, {
    type: 'assign-damage',
    playerId: 'b',
    allocations: [{ targetId: 'ally', amount: 2 }],
  });
}

it('paie 4 énergie, ouvre une réaction, puis protège uniquement à la résolution', () => {
  const initial = fixture();
  const paid = step(initial, cast()).state;
  expect(paid.resources.a?.energy).toBe(0);
  expect(paid.stack?.entries).toHaveLength(1);
  expect(paid.units[0]?.temporaryEffects).toBeUndefined();
  expect(protect(initial).units[0]?.temporaryEffects).toEqual([
    { type: 'recall-on-death' },
  ]);
  expect(initial.resources.a?.energy).toBe(4);
});

it('refuse une cible adverse sans payer ni modifier la main', () => {
  const s = fixture();
  const before = structuredClone(s);
  expect(act(s, cast('enemy'))).toEqual({
    ok: false,
    reason: 'INVALID_TARGET',
  });
  expect(s).toEqual(before);
});

it.each(['a', 'b'])(
  'rappelle Tap et soigne, conserve les effets et équipements, sans mort ni déplacement (défenseur %s)',
  (defender) => {
    let s = fixture();
    const effects = [
      { type: 'modify-might' as const, amount: 2 },
      { type: 'modify-might' as const, amount: -1 },
      { type: 'stun' as const },
    ];
    s.units[0]!.temporaryEffects = effects;
    s.gears = [
      {
        id: 'gear',
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'field',
        ready: true,
        attachedUnitId: 'ally',
      },
    ];
    s = protect(s);
    const result = fight(s, defender);
    expect(result.state.units.find((u) => u.id === 'ally')).toMatchObject({
      zoneId: 'base-a',
      ready: false,
      damage: 0,
      temporaryEffects: effects,
    });
    expect(result.state.gears?.[0]).toMatchObject({
      zoneId: 'base-a',
      attachedUnitId: 'ally',
      ready: true,
    });
    expect(result.state.pendingDeaths).toBeUndefined();
    expect(
      result.events.some((e) =>
        ['unit-died', 'death-triggered', 'unit-moved'].includes(e.type),
      ),
    ).toBe(false);
    expect(result.state.cards.some((c) => c.id === 'ally')).toBe(false);
    expect(result.state.players.find((p) => p.id === 'b')?.score).toBe(
      defender === 'a' ? 1 : 0,
    );
    // Une deuxième mort pendant ce même tour n'est plus remplacée.
    const again = result.state;
    again.units.find((u) => u.id === 'ally')!.zoneId = 'field';
    expect(fight(again).state.units.some((u) => u.id === 'ally')).toBe(false);
  },
);

it('expire en fin du tour courant, même sans avoir servi', () => {
  let s = protect(fixture());
  s.units[0]!.zoneId = 'base-a';
  s.units[1]!.zoneId = 'base-b';
  s.priorityPlayerId = 'a';
  s = step(s, { type: 'end-turn', playerId: 'a' }).state;
  expect(s.units[0]?.temporaryEffects).toEqual([]);
});

it('rappelle aussi un jeton et soigne immédiatement avant le traitement des morts', () => {
  const s = protect(fixture());
  s.units[0]!.token = true;
  s.units[0]!.damage = 4;
  const before = structuredClone(s);
  const result = replaceDeaths(s, new Set(['ally']));
  expect(result.units[0]).toMatchObject({
    token: true,
    damage: 0,
    zoneId: 'base-a',
    ready: false,
  });
  expect(result.dead).toEqual([]);
  expect(result.events).toEqual([
    { type: 'unit-recalled', unitId: 'ally', zoneId: 'base-a' },
  ]);
  expect(s).toEqual(before);
});

it('conserve la protection si les dégâts ne sont pas létaux', () => {
  const s = protect(fixture());
  s.units[0]!.might = 5;
  s.units[0]!.damage = 1;
  const result = replaceDeaths(s, new Set());
  expect(result.units[0]).toEqual(s.units[0]);
  expect(result.events).toEqual([]);
});

it('une unité rappelée inflige tout de même ses dégâts simultanés', () => {
  let s = protect(fixture());
  s.units[0]!.might = 8;
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
  s = step(s, { type: 'pass', playerId: 'a' }).state;
  s = step(s, { type: 'pass', playerId: 'b' }).state;
  s = step(s, {
    type: 'assign-damage',
    playerId: 'a',
    allocations: [{ targetId: 'enemy', amount: 8 }],
  }).state;
  s = step(s, {
    type: 'assign-damage',
    playerId: 'b',
    allocations: [{ targetId: 'ally', amount: 8 }],
  }).state;
  expect(s.units).toHaveLength(1);
  expect(s.units[0]).toMatchObject({ id: 'ally', zoneId: 'base-a', damage: 0 });
  expect(s.cards.find((c) => c.id === 'enemy')?.zoneId).toBe('grave-b');
  expect(s.players.map((p) => p.score)).toEqual([0, 0]);
});

it('revérifie le propriétaire de la cible à la résolution', () => {
  let s = step(fixture(), cast()).state;
  s.units[0]!.ownerId = 'b';
  s = step(s, { type: 'pass', playerId: 'a' }).state;
  s = step(s, { type: 'pass', playerId: 'b' }).state;
  expect(s.units[0]?.temporaryEffects).toBeUndefined();
  expect(s.resources.a?.energy).toBe(0);
  expect(s.cards.find((c) => c.id === 'spell')?.zoneId).toBe('grave-a');
});
