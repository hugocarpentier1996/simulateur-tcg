import { expect, it } from 'vitest';
import {
  annieFury,
  flash,
  deathTestUnits,
  tibbers,
  defineSpell,
  defineGear,
} from '../../game-data/src/index.js';
import {
  act,
  getLegalActions,
  type GameState,
  type GameAction,
} from './index.js';

const definition = tibbers;
const payment = { energyRunes: [], powerRunes: [] };
const play: GameAction = {
  type: 'play-unit',
  playerId: 'a',
  cardId: 'tibbers',
  destinationId: 'base-a',
  payment,
};
function fixture(): GameState {
  return {
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    activePlayerId: 'a',
    phase: 'main',
    showdown: null,
    zones: [
      { id: 'field', kind: 'battlefield' },
      { id: 'second', kind: 'battlefield' },
      ...['a', 'b'].flatMap((ownerId) =>
        (
          [
            'base',
            'hand',
            'graveyard',
            'runes',
            'rune-pile',
            'champion',
          ] as const
        ).map((kind) => ({ id: `${kind}-${ownerId}`, kind, ownerId })),
      ),
    ],
    cards: [
      {
        id: 'tibbers',
        definitionId: definition.id,
        ownerId: 'a',
        zoneId: 'hand-a',
      },
      { id: 'flash', definitionId: flash.id, ownerId: 'a', zoneId: 'hand-a' },
    ],
    unitDefinitions: [definition, annieFury, ...deathTestUnits],
    spellDefinitions: [flash],
    units: [
      {
        id: 'ally',
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'field',
        ready: true,
        might: 6,
        damage: 0,
      },
      {
        id: 'enemy',
        definitionId: 'fixture',
        ownerId: 'b',
        zoneId: 'second',
        ready: true,
        might: 6,
        damage: 0,
      },
      {
        id: 'base',
        definitionId: 'fixture',
        ownerId: 'b',
        zoneId: 'base-b',
        ready: true,
        might: 6,
        damage: 0,
      },
    ],
    resources: {
      a: { energy: 10, power: { rouge: 1, violet: 1 } },
      b: { energy: 0, power: {} },
    },
    battlefields: [
      { zoneId: 'field', controllerId: 'a' },
      { zoneId: 'second', controllerId: 'b' },
    ],
    scoredBattlefields: {},
  };
}
function step(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r;
}
function resolve(s: GameState) {
  s = step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId }).state;
  return step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId });
}

it('pose Tibbers Tap puis ouvre une réaction avant les dégâts à tous les champs', () => {
  const s = fixture();
  const next = step(s, play).state;
  expect(next.units.find((u) => u.id === 'tibbers')).toMatchObject({
    ready: false,
    might: 7,
    damage: 0,
  });
  expect(next.stack?.entries).toHaveLength(1);
  expect(next.units.every((u) => u.damage === 0)).toBe(true);
  const result = resolve(next);
  expect(result.state.units.map((u) => u.damage)).toEqual([3, 3, 0, 0]);
  expect(result.events.filter((e) => e.type === 'ability-damage')).toHaveLength(
    2,
  );
  expect(result.events.some((e) => e.type === 'spell-damage')).toBe(false);
  expect(s.cards.some((c) => c.id === 'tibbers')).toBe(true);
});
it.each([{ rouge: 2 }, { violet: 2 }, { rouge: 1, violet: 1 }])(
  'accepte deux Power bicolores : %j',
  (power) => {
    const s = fixture();
    s.resources.a = { energy: 8, power };
    const next = step(s, play).state;
    expect(
      Object.values(next.resources.a!.power).reduce((a, b) => a + b, 0),
    ).toBe(0);
    expect(getLegalActions(s, 'a').some((a) => a.type === 'play-unit')).toBe(
      true,
    );
  },
);
it('refuse un Power manquant ou de mauvaise couleur', () => {
  const s = fixture();
  for (const power of [{ rouge: 1 }, { rouge: 1, bleu: 1 }]) {
    s.resources.a = { energy: 8, power };
    expect(act(s, play)).toEqual({
      ok: false,
      reason: 'INSUFFICIENT_RESOURCES',
    });
    expect(getLegalActions(s, 'a').some((a) => a.type === 'play-unit')).toBe(
      false,
    );
  }
});
it('Flash en réaction sauve une unité en la ramenant en base avant les dégâts', () => {
  let s = step(fixture(), play).state;
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'flash',
    targetId: 'a',
    selectedUnitIds: ['ally'],
    payment,
  }).state;
  s = resolve(s).state;
  expect(s.stack!.entries).toHaveLength(1);
  s = resolve(s).state;
  expect(s.units.find((u) => u.id === 'ally')).toMatchObject({
    zoneId: 'base-a',
    damage: 0,
  });
  expect(s.units.find((u) => u.id === 'enemy')!.damage).toBe(3);
});
it('Annie augmente chaque dégât de capacité, même quand ces dégâts la tuent', () => {
  const s = fixture();
  s.units.push({
    id: 'annie',
    definitionId: annieFury.id,
    ownerId: 'a',
    zoneId: 'field',
    ready: false,
    might: 4,
    damage: 0,
  });
  const result = resolve(step(s, play).state);
  expect(result.state.units.find((u) => u.id === 'enemy')!.damage).toBe(4);
  expect(result.state.cards.find((c) => c.id === 'annie')!.zoneId).toBe(
    'graveyard-a',
  );
  expect(
    result.events
      .filter((e) => e.type === 'ability-damage')
      .map((e) => e.amount),
  ).toEqual([4, 4, 4]);
});
it('Tibbers joué sur un champ contrôlé se touche lui-même et garde ses dégâts', () => {
  const s = resolve(
    step(fixture(), { ...play, destinationId: 'field' }).state,
  ).state;
  expect(s.units.find((u) => u.id === 'tibbers')!.damage).toBe(3);
});

it('le paiement automatique recycle deux runes même Tap, en complétant le Power flottant', () => {
  const s = fixture();
  s.resources.a = { energy: 8, power: {} };
  for (const color of ['rouge', 'violet'])
    s.cards.push({
      id: color,
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'runes-a',
      ready: false,
      color,
    });
  let action = getLegalActions(s, 'a').find(
    (a) => a.type === 'play-unit' && a.destinationId === 'base-a',
  );
  expect(action).toMatchObject({
    payment: { energyRunes: [], powerRunes: ['rouge', 'violet'] },
  });
  expect(
    step(s, action!).state.cards.filter((c) => c.zoneId === 'rune-pile-a'),
  ).toHaveLength(2);
  s.resources.a.power = { violet: 1 };
  action = getLegalActions(s, 'a').find((a) => a.type === 'play-unit');
  expect(action).toMatchObject({ payment: { powerRunes: ['rouge'] } });
});

it('les morts simultanées ouvrent leurs choix puis une nouvelle pile réactive', () => {
  const s = fixture();
  for (const u of s.units.slice(0, 2)) {
    u.definitionId = 'reborn';
    u.might = 1;
  }
  let next = resolve(step(s, play).state).state;
  expect(next.pendingDeaths?.playerOrder).toEqual(['a', 'b']);
  expect(
    next.cards
      .filter((c) => ['ally', 'enemy'].includes(c.id))
      .map((c) => c.zoneId),
  ).toEqual(['graveyard-a', 'graveyard-b']);
  next = step(next, {
    type: 'queue-death-effects',
    playerId: 'a',
    effects: [{ sourceId: 'ally', destinationId: 'base-a' }],
  }).state;
  next = step(next, {
    type: 'queue-death-effects',
    playerId: 'b',
    effects: [{ sourceId: 'enemy', destinationId: 'base-b' }],
  }).state;
  expect(next.stack!.entries).toHaveLength(2);
  next = resolve(resolve(next).state).state;
  expect(next.units.filter((u) => u.token)).toHaveLength(2);
  expect(next.players.map((p) => p.score)).toEqual([0, 0]);
});

it('la capacité reste empilée même si Tibbers disparaît avant sa résolution', () => {
  const s = step(fixture(), play).state;
  s.units = s.units.filter((u) => u.id !== 'tibbers');
  expect(resolve(s).state.units.find((u) => u.id === 'enemy')!.damage).toBe(3);
});

it('le chosen champion déclenche aussi la capacité de mise en jeu', () => {
  const s = fixture();
  s.cards[0]!.zoneId = 'champion-a';
  expect(step(s, play).state.stack?.entries).toHaveLength(1);
});

it('les catalogues conservent aussi le nombre de Power flexibles des sorts et gears', () => {
  expect(defineSpell({ ...flash, cost: tibbers.cost }).cost).toEqual(
    tibbers.cost,
  );
  expect(
    defineGear({
      id: 'test',
      name: 'Test',
      type: 'gear',
      cost: tibbers.cost,
      equipCost: tibbers.cost,
      effects: [],
    }).equipCost,
  ).toEqual(tibbers.cost);
});
