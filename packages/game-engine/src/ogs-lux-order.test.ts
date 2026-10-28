import { expect, it } from 'vitest';
import { flash, luxOrder } from '../../game-data/src/index.js';
import {
  act,
  getLegalActions,
  type GameState,
  type GameAction,
} from './index.js';
import { payCost } from './cost/payment.js';
import { findPayment } from './legal/payment.js';
import { clearResources } from './turn/resources.js';

const payment = { energyRunes: [], powerRunes: [] };
const activate: GameAction = {
  type: 'activate-spell-energy',
  playerId: 'a',
  unitId: 'lux',
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
    zones: ['a', 'b'].flatMap((ownerId) =>
      (['base', 'hand', 'graveyard'] as const).map((kind) => ({
        id: `${kind}-${ownerId}`,
        kind,
        ownerId,
      })),
    ),
    cards: [
      { id: 'flash', definitionId: flash.id, ownerId: 'a', zoneId: 'hand-a' },
    ],
    unitDefinitions: [luxOrder],
    spellDefinitions: [flash],
    units: [
      {
        id: 'lux',
        definitionId: luxOrder.id,
        ownerId: 'a',
        zoneId: 'base-a',
        ready: true,
        might: 2,
        damage: 0,
      },
    ],
    resources: { a: { energy: 0, power: {} }, b: { energy: 0, power: {} } },
    battlefields: [],
    scoredBattlefields: {},
  };
}
function step(state: GameState, action: GameAction) {
  const result = act(state, action);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.reason);
  return result;
}
it('ADD épuise Lux, ajoute immédiatement 2 énergie réservée et conserve la priorité sans pile', () => {
  const state = fixture();
  const next = step(state, activate).state;
  expect(next.resources.a).toEqual({ energy: 0, power: {}, spellEnergy: 2 });
  expect(next.units[0]!.ready).toBe(false);
  expect(next.stack).toBeUndefined();
  expect(state.units[0]!.ready).toBe(true);
  expect(act(next, activate)).toEqual({ ok: false, reason: 'UNIT_NOT_READY' });
});
it('le paiement automatique propose Flash, utilise la réserve avant l’énergie libre', () => {
  const state = fixture();
  state.resources.a = { energy: 1, power: {}, spellEnergy: 2 };
  const action = getLegalActions(state, 'a').find(
    (a) => a.type === 'cast-spell',
  );
  expect(action).toBeDefined();
  const next = step(state, action!).state;
  expect(next.resources.a).toEqual({ energy: 1, power: {}, spellEnergy: 0 });
});
it('un coût ordinaire ne consomme jamais la réserve des sorts, même avec Power flexible', () => {
  const state = fixture();
  state.resources.a = { energy: 0, power: { jaune: 1 }, spellEnergy: 2 };
  const cost = { energy: 2, power: {}, powerChoice: ['orange', 'jaune'] };
  expect(payCost(state, 'a', cost, payment).ok).toBe(false);
  expect(findPayment(state, 'a', cost)).toBeNull();
  expect(findPayment(state, 'a', cost, 'spell')).toEqual(payment);
  state.resources.a.energy = 2;
  const paid = payCost(state, 'a', cost, payment);
  expect(paid.ok && paid.state.resources.a?.spellEnergy).toBe(2);
});
it('une activation est proposée uniquement au propriétaire Ready dans la bonne fenêtre', () => {
  const state = fixture();
  expect(getLegalActions(state, 'a')).toContainEqual(activate);
  expect(act(state, { ...activate, playerId: 'b' }).ok).toBe(false);
  state.phase = 'draw';
  expect(act(state, activate).ok).toBe(false);
});
it('ADD est possible en réaction sans ajouter une entrée ni changer la priorité', () => {
  const state = fixture();
  state.resources.a!.energy = 2;
  const cast = step(state, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'flash',
    targetId: 'a',
    selectedUnitIds: [],
    payment,
  }).state;
  const next = step(cast, activate).state;
  expect(next.stack).toEqual(cast.stack);
  expect(next.resources.a?.spellEnergy).toBe(2);
});
it.each(['end', 'draw'] as const)(
  'la réserve expire à la frontière %s',
  (boundary) => {
    const state = fixture();
    state.resources.a!.spellEnergy = 2;
    expect(
      clearResources(state, boundary).state.resources.a?.spellEnergy ?? 0,
    ).toBe(0);
  },
);

it('Lux coûte 4 énergie et entre Tap ; elle ne peut pas payer sa propre invocation avec la réserve', () => {
  const state = fixture();
  state.cards.push({
    id: 'second-lux',
    definitionId: luxOrder.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  state.resources.a = { energy: 3, power: {}, spellEnergy: 2 };
  const play: GameAction = {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'second-lux',
    destinationId: 'base-a',
    payment,
  };
  expect(act(state, play)).toEqual({
    ok: false,
    reason: 'INSUFFICIENT_RESOURCES',
  });
  state.resources.a.energy = 4;
  const next = step(state, play).state;
  expect(next.units.find((u) => u.id === 'second-lux')).toMatchObject({
    might: 2,
    ready: false,
  });
  expect(next.resources.a?.spellEnergy).toBe(2);
});

it.each(['play-gear', 'equip-gear'] as const)(
  'la réserve ne paie pas %s',
  (type) => {
    const state = fixture();
    state.resources.a = { energy: 0, power: {}, spellEnergy: 2 };
    state.gearDefinitions = [
      {
        id: 'equipment',
        type: 'gear',
        cost: { energy: 2, power: {} },
        equipCost: { energy: 2, power: {} },
        effects: [],
      },
    ];
    state.cards.push({
      id: 'gear-card',
      definitionId: 'equipment',
      ownerId: 'a',
      zoneId: 'hand-a',
    });
    state.gears = [
      {
        id: 'gear',
        definitionId: 'equipment',
        ownerId: 'a',
        zoneId: 'base-a',
        ready: true,
      },
    ];
    const action: GameAction =
      type === 'play-gear'
        ? { type, playerId: 'a', cardId: 'gear-card', payment }
        : { type, playerId: 'a', gearId: 'gear', unitId: 'lux', payment };
    expect(act(state, action)).toEqual({
      ok: false,
      reason: 'INSUFFICIENT_RESOURCES',
    });
    expect(getLegalActions(state, 'a').some((a) => a.type === type)).toBe(
      false,
    );
  },
);

it('refuse une unité sans ADD et une activation sans priorité dans la pile', () => {
  const state = fixture();
  state.unitDefinitions = [];
  expect(act(state, activate)).toEqual({
    ok: false,
    reason: 'NO_RESOURCE_ABILITY',
  });
  state.unitDefinitions = [luxOrder];
  state.stack = {
    entries: [],
    initiatorId: 'b',
    priorityPlayerId: 'b',
    consecutivePasses: 0,
  };
  expect(act(state, activate)).toEqual({
    ok: false,
    reason: 'ABILITY_WINDOW_CLOSED',
  });
});

it.each(['open', 'priority', 'damage', 'effects'] as const)(
  'respecte la fenêtre de Showdown %s',
  (stage) => {
    const state = fixture();
    state.zones.push({ id: 'field', kind: 'battlefield' });
    state.battlefields = [{ zoneId: 'field', controllerId: 'b' }];
    const common = {
      battlefieldId: 'field',
      initiatorId: 'a',
      participants: ['a', 'b'],
      priorityPlayerId: 'a',
      consecutivePasses: 0,
    };
    state.showdown =
      stage === 'open'
        ? { ...common, kind: 'open' }
        : {
            ...common,
            kind: 'combat',
            stage,
            defenderId: 'b',
            assignments: {},
          };
    expect(act(state, activate).ok).toBe(
      stage === 'open' || stage === 'priority',
    );
    state.showdown.priorityPlayerId = 'b';
    expect(act(state, activate).ok).toBe(false);
  },
);
