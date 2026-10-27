import { expect, it } from 'vitest';
import {
  firestorm,
  annieFury,
  deathTestUnits,
  defineSpell,
} from '../../game-data/src/index.js';
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
    zones: [
      { id: 'field', kind: 'battlefield' },
      { id: 'field-2', kind: 'battlefield' },
      ...['a', 'b'].flatMap((ownerId) =>
        (['base', 'hand', 'graveyard'] as const).map((kind) => ({
          id: `${kind}-${ownerId}`,
          kind,
          ownerId,
        })),
      ),
    ],
    spellDefinitions: [firestorm],
    unitDefinitions: [annieFury, ...deathTestUnits],
    cards: [
      {
        id: 'firestorm',
        definitionId: firestorm.id,
        ownerId: 'a',
        zoneId: 'hand-a',
      },
    ],
    units: [
      {
        id: 'enemy-1',
        definitionId: 'fixture',
        ownerId: 'b',
        zoneId: 'field',
        might: 3,
        damage: 0,
        ready: true,
      },
      {
        id: 'enemy-2',
        definitionId: 'fixture',
        ownerId: 'b',
        zoneId: 'field',
        might: 5,
        damage: 0,
        ready: true,
      },
      {
        id: 'ally',
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'field',
        might: 3,
        damage: 0,
        ready: true,
      },
      {
        id: 'away',
        definitionId: 'fixture',
        ownerId: 'b',
        zoneId: 'field-2',
        might: 3,
        damage: 0,
        ready: true,
      },
      {
        id: 'base',
        definitionId: 'fixture',
        ownerId: 'b',
        zoneId: 'base-b',
        might: 3,
        damage: 0,
        ready: true,
      },
    ],
    resources: { a: { energy: 6, power: { rouge: 1 } } },
    battlefields: [
      { zoneId: 'field', controllerId: 'b' },
      { zoneId: 'field-2', controllerId: 'b' },
    ],
    scoredBattlefields: {},
    showdown: null,
  };
}
const cast: Extract<GameAction, { type: 'cast-spell' }> = {
  type: 'cast-spell',
  playerId: 'a',
  cardId: 'firestorm',
  targetId: 'field',
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

it('paie 6 énergie et 1 rouge, puis touche seulement tous les ennemis du champ choisi', () => {
  const paid = step(fixture(), cast).state;
  expect(paid.resources.a).toEqual({ energy: 0, power: { rouge: 0 } });
  expect(paid.units.map((u) => u.damage)).toEqual([0, 0, 0, 0, 0]);
  const r = resolve(paid);
  expect(r.state.units.map((u) => [u.id, u.damage])).toEqual([
    ['enemy-2', 3],
    ['ally', 0],
    ['away', 0],
    ['base', 0],
  ]);
  expect(r.state.players[0]?.score).toBe(0);
});

it('propose les champs comme cibles et refuse une unité ou une base', () => {
  const s = fixture();
  const actions = getLegalActions(s, 'a').filter(
    (a) => a.type === 'cast-spell',
  );
  expect(
    actions.map((a) => (a.type === 'cast-spell' ? a.targetId : '')),
  ).toEqual(['field', 'field-2']);
  expect(act(s, { ...cast, targetId: 'ally' })).toEqual({
    ok: false,
    reason: 'INVALID_TARGET',
  });
  expect(act(s, { ...cast, targetId: 'base-b' })).toEqual({
    ok: false,
    reason: 'INVALID_TARGET',
  });
});

it('reste un sort Normal, interdit en showdown et en réaction', () => {
  const s = fixture();
  s.showdown = {
    kind: 'open',
    battlefieldId: 'field',
    initiatorId: 'a',
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  expect(act(s, cast)).toEqual({ ok: false, reason: 'SPELL_WINDOW_CLOSED' });
  s.showdown = null;
  s.stack = {
    entries: [],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  expect(act(s, cast)).toEqual({ ok: false, reason: 'SPELL_WINDOW_CLOSED' });
});

it('Annie donne +1 pour chaque ennemi touché et les morts suivent tous les dégâts', () => {
  const s = fixture();
  s.units[1]!.might = 4;
  s.units.push({
    ...s.units[2]!,
    id: 'annie',
    definitionId: annieFury.id,
    zoneId: 'base-a',
    might: 4,
  });
  const r = resolve(step(s, cast).state);
  expect(
    r.events.filter((e) => e.type === 'spell-damage').map((e) => e.amount),
  ).toEqual([4, 4]);
  const damageIndexes = r.events.flatMap((e, i) =>
    e.type === 'spell-damage' ? [i] : [],
  );
  expect(r.events.findIndex((e) => e.type === 'unit-died')).toBeGreaterThan(
    Math.max(...damageIndexes),
  );
  expect(r.state.units.some((u) => u.id.startsWith('enemy'))).toBe(false);
});

it('deux morts déclenchées sont toutes au cimetière avant les choix du joueur', () => {
  const s = fixture();
  for (const u of s.units.slice(0, 2)) {
    u.definitionId = 'reborn';
    u.might = 1;
  }
  const r = resolve(step(s, cast).state);
  expect(r.state.pendingDeaths?.triggers.map((t) => t.sourceId)).toEqual([
    'enemy-1',
    'enemy-2',
  ]);
  expect(
    r.state.cards.filter((c) => c.id.startsWith('enemy')).map((c) => c.zoneId),
  ).toEqual(['graveyard-b', 'graveyard-b']);
});

it('évalue les ennemis présents à la résolution, après les réactions', () => {
  const s = step(fixture(), cast).state;
  s.units[0]!.zoneId = 'base-b';
  s.units[3]!.zoneId = 'field';
  const r = resolve(s);
  expect(r.state.units.find((u) => u.id === 'enemy-1')?.damage).toBe(0);
  expect(r.state.units.some((u) => u.id === 'away')).toBe(false);
});

it('refuse une quantité de dégâts de zone négative', () => {
  expect(() =>
    defineSpell({
      ...firestorm,
      effects: [{ type: 'damage-enemies-at-battlefield', amount: -1 }],
    }),
  ).toThrow(RangeError);
});

it('un champ supprimé avant résolution ne touche aucune unité', () => {
  const s = step(fixture(), cast).state;
  s.battlefields = s.battlefields.filter((f) => f.zoneId !== 'field');
  const r = resolve(s);
  expect(r.state.units.map((u) => u.damage)).toEqual([0, 0, 0, 0, 0]);
  expect(r.state.cards.find((c) => c.id === 'firestorm')?.zoneId).toBe(
    'graveyard-a',
  );
});
