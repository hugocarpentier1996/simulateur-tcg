import { expect, it } from 'vitest';
import { flash, blastOfPower } from '../../game-data/src/index.js';
import {
  act,
  getLegalActions,
  type GameState,
  type GameAction,
} from './index.js';

function fixture(): GameState {
  return {
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    spellDefinitions: [flash, blastOfPower],
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
    cards: [
      { id: 'flash', definitionId: flash.id, ownerId: 'a', zoneId: 'hand-a' },
      {
        id: 'blast',
        definitionId: blastOfPower.id,
        ownerId: 'b',
        zoneId: 'hand-b',
      },
    ],
    units: [
      {
        id: 'one',
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'field',
        might: 4,
        damage: 1,
        ready: true,
        temporaryEffects: [{ type: 'stun' }],
      },
      {
        id: 'two',
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'field',
        might: 4,
        damage: 2,
        ready: false,
      },
      {
        id: 'enemy',
        definitionId: 'fixture',
        ownerId: 'b',
        zoneId: 'base-b',
        might: 3,
        damage: 0,
        ready: true,
      },
    ],
    resources: {
      a: { energy: 2, power: {} },
      b: { energy: 6, power: { jaune: 1 } },
    },
    battlefields: [{ zoneId: 'field', controllerId: 'a' }],
    scoredBattlefields: { a: ['field'] },
    showdown: null,
  };
}
const cast = (ids: readonly string[]): GameAction => ({
  type: 'cast-spell',
  playerId: 'a',
  cardId: 'flash',
  targetId: 'a',
  selectedUnitIds: ids,
  payment: { energyRunes: [], powerRunes: [] },
});
function step(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r;
}
function resolve(s: GameState) {
  s = step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId }).state;
  return step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId });
}

it('déplace deux unités Ready/Tap sans soin ni perte de Stun et suit l’équipement', () => {
  const s = fixture();
  s.gears = [
    {
      id: 'gear',
      definitionId: 'fixture',
      ownerId: 'a',
      zoneId: 'field',
      ready: true,
      attachedUnitId: 'one',
    },
  ];
  const paid = step(s, cast(['one', 'two'])).state;
  expect(paid.resources.a?.energy).toBe(0);
  expect(paid.units[0]?.zoneId).toBe('field');
  const r = resolve(paid);
  expect(r.state.units[0]).toMatchObject({
    zoneId: 'base-a',
    damage: 1,
    ready: true,
    temporaryEffects: [{ type: 'stun' }],
  });
  expect(r.state.units[1]).toMatchObject({
    zoneId: 'base-a',
    damage: 2,
    ready: false,
  });
  expect(r.state.gears?.[0]).toMatchObject({
    zoneId: 'base-a',
    attachedUnitId: 'one',
  });
  expect(r.state.battlefields[0]?.controllerId).toBeNull();
  expect(r.state.scoredBattlefields.a).toEqual(['field']);
  expect(r.events.filter((e) => e.type === 'unit-moved')).toHaveLength(2);
});

it.each([[], ['one'], ['one', 'two']].map((ids) => ({ ids })))(
  'propose et accepte la sélection $ids',
  ({ ids }) => {
    const s = fixture();
    expect(getLegalActions(s, 'a')).toContainEqual(cast(ids));
    const r = resolve(step(s, cast(ids)).state);
    expect(r.state.units.filter((u) => u.zoneId === 'base-a')).toHaveLength(
      ids.length,
    );
  },
);

it.each(
  [['one', 'one'], ['one', 'two', 'enemy'], ['enemy'], ['missing']].map(
    (ids) => ({ ids }),
  ),
)('refuse la sélection invalide $ids sans payer', ({ ids }) => {
  const s = fixture();
  expect(act(s, cast(ids))).toEqual({ ok: false, reason: 'INVALID_TARGET' });
  expect(s.resources.a?.energy).toBe(2);
});

it('Flash en réaction à Blast of Power sauve sa cible revenue en base', () => {
  let s = fixture();
  s.activePlayerId = 'b';
  s = step(s, {
    type: 'cast-spell',
    playerId: 'b',
    cardId: 'blast',
    targetId: 'one',
    payment: { energyRunes: [], powerRunes: [] },
  }).state;
  s = step(s, { type: 'pass', playerId: 'b' }).state;
  s = step(s, cast(['one'])).state;
  s = resolve(s).state;
  expect(s.units[0]?.zoneId).toBe('base-a');
  s = resolve(s).state;
  expect(s.units[0]).toMatchObject({ id: 'one', damage: 1, zoneId: 'base-a' });
  expect(s.cards.find((c) => c.id === 'blast')?.zoneId).toBe('graveyard-b');
  expect(s.resources.b).toEqual({ energy: 0, power: { jaune: 0 } });
});

it('copie les choix et ignore une cible disparue sans annuler le déplacement de l’autre', () => {
  const ids = ['one', 'two'];
  let s = step(fixture(), cast(ids)).state;
  ids[0] = 'enemy';
  s.units = s.units.filter((u) => u.id !== 'two');
  s = resolve(s).state;
  expect(s.units.find((u) => u.id === 'one')?.zoneId).toBe('base-a');
  expect(s.units.find((u) => u.id === 'enemy')?.zoneId).toBe('base-b');
});

it('conserve le contrôle du défenseur pendant le showdown malgré son départ', () => {
  const s = fixture();
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
  s.units[2]!.zoneId = 'field';
  const r = resolve(step(s, cast(['one', 'two'])).state);
  expect(r.state.battlefields[0]?.controllerId).toBe('a');
  expect(r.state.players.map((p) => p.score)).toEqual([0, 0]);
});

it('ne redéplace pas une unité déjà en base et ne soigne pas ses blessures', () => {
  const s = fixture();
  s.units[0]!.zoneId = 'base-a';
  const r = resolve(step(s, cast(['one'])).state);
  expect(r.state.units[0]).toMatchObject({
    damage: 1,
    ready: true,
    zoneId: 'base-a',
  });
  expect(r.events.some((e) => e.type === 'unit-moved')).toBe(false);
});

it('une cible devenue adverse ne suit pas Flash', () => {
  let s = step(fixture(), cast(['one', 'two'])).state;
  s.units[0]!.ownerId = 'b';
  s = resolve(s).state;
  expect(s.units[0]?.zoneId).toBe('field');
  expect(s.units[1]?.zoneId).toBe('base-a');
});
