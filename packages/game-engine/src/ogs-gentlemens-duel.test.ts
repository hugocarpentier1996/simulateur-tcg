import { expect, it } from 'vitest';
import {
  gentlemensDuel,
  highlander,
  testSpells,
} from '../../game-data/src/index.js';
import {
  act,
  effectiveMight,
  getLegalActions,
  type GameState,
  type GameAction,
} from './index.js';
import { withDrawSupplies } from './test-fixtures.js';

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
      ...['a', 'b'].flatMap((ownerId) =>
        (['base', 'graveyard'] as const).map((kind) => ({
          id: `${kind}-${ownerId}`,
          kind,
          ownerId,
        })),
      ),
    ],
    spellDefinitions: [gentlemensDuel, highlander, ...testSpells],
    cards: [gentlemensDuel, highlander, ...testSpells].map((d) => ({
      id: d.id,
      definitionId: d.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    })),
    units: [
      {
        id: 'ally',
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'base-a',
        ready: false,
        might: 2,
        damage: 0,
      },
      {
        id: 'enemy',
        definitionId: 'fixture',
        ownerId: 'b',
        zoneId: 'field',
        ready: true,
        might: 4,
        damage: 0,
      },
    ],
    resources: { a: { energy: 10, power: { orange: 1, 'color-1': 1 } } },
    battlefields: [{ zoneId: 'field', controllerId: 'b' }],
    scoredBattlefields: {},
    showdown: null,
  });
}
const cast: Extract<GameAction, { type: 'cast-spell' }> = {
  type: 'cast-spell',
  playerId: 'a',
  cardId: gentlemensDuel.id,
  targetId: 'ally',
  secondaryTargetId: 'enemy',
  payment: { energyRunes: [], powerRunes: [] },
};
function step(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r;
}
function resolve(s: GameState) {
  s = step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId }).state;
  return step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId });
}

it('paie 6 énergie et 1 orange, fige les deux cibles puis donne +3 avant les dégâts', () => {
  const s = fixture();
  const paid = step(s, cast).state;
  expect(paid.resources.a).toMatchObject({ energy: 4, power: { orange: 0 } });
  expect(paid.stack?.entries[0]).toMatchObject({
    targetId: 'ally',
    secondaryTargetId: 'enemy',
  });
  expect(effectiveMight(paid.units[0]!, paid)).toBe(2);
  const r = resolve(paid);
  expect(r.state.units).toHaveLength(1);
  expect(r.state.units[0]).toMatchObject({
    id: 'ally',
    damage: 4,
    ready: false,
    zoneId: 'base-a',
  });
  expect(effectiveMight(r.state.units[0]!, r.state)).toBe(5);
  expect(r.state.cards.find((c) => c.id === 'enemy')?.zoneId).toBe(
    'graveyard-b',
  );
  expect(s.units[0]?.temporaryEffects).toBeUndefined();
});

it.each([undefined, 'absent', 'ally'])(
  'refuse une seconde cible invalide (%s) avant paiement',
  (secondaryTargetId) => {
    const s = fixture();
    const base = { ...cast };
    delete base.secondaryTargetId;
    const invalid =
      secondaryTargetId === undefined ? base : { ...base, secondaryTargetId };
    const before = structuredClone(s);
    expect(act(s, invalid)).toEqual({ ok: false, reason: 'INVALID_TARGET' });
    expect(s).toEqual(before);
  },
);

it('refuse de désigner un ennemi comme unité alliée et énumère la paire légale', () => {
  const s = fixture();
  expect(
    act(s, { ...cast, targetId: 'enemy', secondaryTargetId: 'ally' }),
  ).toEqual({ ok: false, reason: 'INVALID_TARGET' });
  const actions = getLegalActions(s, 'a').filter(
    (a) => a.type === 'cast-spell' && a.cardId === gentlemensDuel.id,
  );
  expect(actions).toHaveLength(1);
  expect(actions[0]).toMatchObject({
    targetId: 'ally',
    secondaryTargetId: 'enemy',
  });
});

it('les dégâts sont simultanés et Stun ne les empêche pas', () => {
  const s = fixture();
  s.units[1]!.might = 5;
  for (const u of s.units) u.temporaryEffects = [{ type: 'stun' }];
  const r = resolve(step(s, cast).state);
  expect(r.state.units).toEqual([]);
  expect(
    r.state.cards.filter((c) => ['ally', 'enemy'].includes(c.id)),
  ).toHaveLength(2);
  expect(r.state.showdown).toBeNull();
  expect(r.state.players.map((p) => p.score)).toEqual([0, 0]);
});

it('utilise les Might modifiées par une réaction, et conserve les deux cibles', () => {
  let s = step(fixture(), cast).state;
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'test-reinforce',
    targetId: 'enemy',
    payment: { energyRunes: [], powerRunes: [] },
  }).state;
  s = resolve(s).state;
  s = resolve(s).state;
  expect(s.units).toHaveLength(1);
  expect(s.units[0]).toMatchObject({ id: 'enemy', damage: 5 });
});

it('cible ennemie disparue : conserve le bonus allié sans dégâts ni remplacement de cible', () => {
  let s = step(fixture(), cast).state;
  s.units = s.units.filter((u) => u.id !== 'enemy');
  s.units.push({
    id: 'another',
    definitionId: 'fixture',
    ownerId: 'b',
    zoneId: 'base-b',
    ready: true,
    might: 9,
    damage: 0,
  });
  s = resolve(s).state;
  expect(effectiveMight(s.units[0]!, s)).toBe(5);
  expect(s.units.map((u) => u.damage)).toEqual([0, 0]);
});

it('Highlander remplace la mort sans retirer les dégâts réciproques déjà infligés', () => {
  let s = fixture();
  s.units[1]!.might = 5;
  s = step(s, cast).state;
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: highlander.id,
    targetId: 'ally',
    payment: { energyRunes: [], powerRunes: [] },
  }).state;
  s = resolve(s).state;
  s = resolve(s).state;
  expect(s.units).toHaveLength(1);
  expect(s.units[0]).toMatchObject({
    id: 'ally',
    damage: 0,
    ready: false,
    zoneId: 'base-a',
  });
  expect(effectiveMight(s.units[0]!, s)).toBe(5);
});

it('attribue les dégâts aux unités hors combat, jamais au sort ni à une capacité', () => {
  const r = resolve(step(fixture(), cast).state);
  expect(r.events.filter((e) => e.type === 'unit-damage')).toEqual([
    {
      type: 'unit-damage',
      context: 'duel',
      sourceId: 'ally',
      unitId: 'enemy',
      amount: 5,
    },
    {
      type: 'unit-damage',
      context: 'duel',
      sourceId: 'enemy',
      unitId: 'ally',
      amount: 4,
    },
  ]);
  expect(
    r.events.some(
      (e) =>
        e.type === 'spell-damage' ||
        e.type === 'combat-damage' ||
        e.type === 'showdown-opened',
    ),
  ).toBe(false);
});

it('allié disparu : aucun bonus ni dégât ; le sort reste payé et rejoint le cimetière', () => {
  let s = step(fixture(), cast).state;
  s.units = s.units.filter((u) => u.id !== 'ally');
  s = resolve(s).state;
  expect(s.units[0]).toMatchObject({ id: 'enemy', damage: 0 });
  expect(s.resources.a?.energy).toBe(4);
  expect(s.cards.find((c) => c.id === gentlemensDuel.id)?.zoneId).toBe(
    'graveyard-a',
  );
});

it('expire le +3 en fin de tour avec le soin global', () => {
  let s = resolve(step(fixture(), cast).state).state;
  s.priorityPlayerId = 'a';
  s = step(s, { type: 'end-turn', playerId: 'a' }).state;
  expect(s.units[0]).toMatchObject({
    id: 'ally',
    damage: 0,
    temporaryEffects: [],
  });
  expect(effectiveMight(s.units[0]!, s)).toBe(2);
});
