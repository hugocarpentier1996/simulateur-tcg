import { describe, expect, it } from 'vitest';
import { testSpells } from '../../game-data/src/index.js';
import { act, type GameAction, type GameState } from './index.js';
import { effectiveMight, isStunned } from './effects/modifiers.js';
import { withDrawSupplies } from './test-fixtures.js';

function scenario(): GameState {
  return withDrawSupplies({
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    spellDefinitions: testSpells,
    zones: [
      { id: 'base-a', kind: 'base', ownerId: 'a' },
      { id: 'base-b', kind: 'base', ownerId: 'b' },
      { id: 'grave-a', kind: 'graveyard', ownerId: 'a' },
      { id: 'grave-b', kind: 'graveyard', ownerId: 'b' },
      { id: 'field', kind: 'battlefield' },
    ],
    cards: ['a', 'b'].flatMap((ownerId) =>
      testSpells.map((def) => ({
        id: `${ownerId}-${def.id}`,
        definitionId: def.id,
        ownerId,
        zoneId: `hand-${ownerId}`,
      })),
    ),
    units: [
      {
        id: 'ua',
        definitionId: 'unit',
        ownerId: 'a',
        zoneId: 'base-a',
        ready: false,
        might: 3,
        damage: 0,
      },
      {
        id: 'ub',
        definitionId: 'unit',
        ownerId: 'b',
        zoneId: 'base-b',
        ready: true,
        might: 2,
        damage: 0,
      },
    ],
    resources: {
      a: { energy: 10, power: { 'color-1': 10, 'color-2': 10 } },
      b: { energy: 10, power: { 'color-1': 10, 'color-2': 10 } },
    },
    battlefields: [{ zoneId: 'field', controllerId: null }],
    scoredBattlefields: {},
    showdown: null,
  });
}
function cast(
  playerId: string,
  name: string,
  targetId: string,
  destinationId?: string,
): GameAction {
  return {
    type: 'cast-spell',
    playerId,
    cardId: `${playerId}-test-${name}`,
    targetId,
    payment: { energyRunes: [], powerRunes: [] },
    ...(destinationId ? { destinationId } : {}),
  };
}
function apply(state: GameState, action: GameAction): GameState {
  const result = act(state, action);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}
function passes(state: GameState): GameState {
  state = apply(state, { type: 'pass', playerId: 'a' });
  return apply(state, { type: 'pass', playerId: 'b' });
}
function combat(): GameState {
  const state = scenario();
  state.units.forEach((u) => {
    u.zoneId = 'field';
  });
  state.battlefields[0]!.controllerId = 'b';
  state.showdown = {
    kind: 'combat',
    battlefieldId: 'field',
    initiatorId: 'a',
    defenderId: 'b',
    stage: 'priority',
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
    assignments: {},
  };
  return state;
}

describe('sorts et fenêtres de Réaction', () => {
  it('ne conquiert pas un Open Showdown vidé par un déplacement', () => {
    let state = scenario();
    state.units[0]!.zoneId = 'field';
    state.showdown = {
      kind: 'open',
      battlefieldId: 'field',
      initiatorId: 'a',
      participants: ['a', 'b'],
      priorityPlayerId: 'a',
      consecutivePasses: 0,
    };
    state = passes(apply(state, cast('a', 'reposition', 'ua', 'base-a')));
    state = apply(state, { type: 'pass', playerId: 'b' });
    state = apply(state, { type: 'pass', playerId: 'a' });
    expect(state.showdown).toBeNull();
    expect(state.players[0]?.score).toBe(0);
    expect(state.battlefields[0]?.controllerId).toBeNull();
  });
  it('utilise la Might modifiée pour les dégâts disponibles et le seuil létal', () => {
    let state = combat();
    state = passes(apply(state, cast('a', 'reinforce', 'ub')));
    state = apply(state, { type: 'pass', playerId: 'b' });
    state = apply(state, { type: 'pass', playerId: 'a' });
    expect(
      act(state, {
        type: 'assign-damage',
        playerId: 'a',
        allocations: [{ targetId: 'ub', amount: 2 }],
      }).ok,
    ).toBe(false);
    state = apply(state, {
      type: 'assign-damage',
      playerId: 'a',
      allocations: [{ targetId: 'ub', amount: 3 }],
    });
    state = apply(state, {
      type: 'assign-damage',
      playerId: 'b',
      allocations: [{ targetId: 'ua', amount: 3 }],
    });
    expect(state.units.map((u) => u.id)).toEqual(['ub']);
    expect(state.battlefields[0]?.controllerId).toBe('b');
  });
  it('rend la priorité de Main par une passe et retire le malus à la fin du tour', () => {
    let state = passes(apply(scenario(), cast('a', 'weaken-draw', 'ub')));
    expect(act(state, { type: 'end-turn', playerId: 'a' }).ok).toBe(false);
    state = apply(state, { type: 'pass', playerId: 'b' });
    state = apply(state, { type: 'end-turn', playerId: 'a' });
    expect(effectiveMight(state.units[1]!)).toBe(2);
    expect(state.priorityPlayerId).toBe('b');
  });
  it('préserve le Showdown courant et traite ensuite une arrivée sur un autre champ', () => {
    let state = combat();
    state.zones.push({ id: 'field-2', kind: 'battlefield' });
    state.battlefields.push({ zoneId: 'field-2', controllerId: null });
    state = passes(apply(state, cast('a', 'reposition', 'ua', 'field-2')));
    expect(state.showdown?.battlefieldId).toBe('field');
    expect(state.battlefields[0]?.controllerId).toBe('b');
    state = apply(state, { type: 'pass', playerId: 'b' });
    state = apply(state, { type: 'pass', playerId: 'a' });
    state = apply(state, {
      type: 'assign-damage',
      playerId: 'a',
      allocations: [],
    });
    state = apply(state, {
      type: 'assign-damage',
      playerId: 'b',
      allocations: [],
    });
    expect(state.showdown).toMatchObject({
      battlefieldId: 'field-2',
      kind: 'open',
      initiatorId: 'a',
    });
  });
  it('paie au lancement mais attend deux passes pour résoudre le sort normal et piocher', () => {
    const input = scenario();
    const before = structuredClone(input);
    const pending = apply(input, cast('a', 'weaken-draw', 'ub'));
    expect(pending.resources.a?.energy).toBe(9);
    expect(effectiveMight(pending.units[1]!)).toBe(2);
    expect(pending.stack?.entries).toHaveLength(1);
    expect(act(pending, { type: 'end-turn', playerId: 'a' }).ok).toBe(false);
    const state = passes(pending);
    expect(effectiveMight(state.units[1]!)).toBe(1);
    expect(state.cards.find((c) => c.id === 'card-a-0')?.zoneId).toBe('hand-a');
    expect(state.cards.find((c) => c.id === 'a-test-weaken-draw')?.zoneId).toBe(
      'grave-a',
    );
    expect(state.stack).toBeNull();
    expect(input).toEqual(before);
  });
  it('accepte réaction sur réaction, résout LIFO et rouvre une fenêtre entre chaque sort', () => {
    let state = apply(scenario(), cast('a', 'weaken-draw', 'ub'));
    state = apply(state, { type: 'pass', playerId: 'a' });
    state = apply(state, cast('b', 'reinforce', 'ub'));
    state = apply(state, cast('a', 'reinforce', 'ub'));
    state = passes(state);
    expect(effectiveMight(state.units[1]!)).toBe(4);
    expect(state.stack?.entries).toHaveLength(2);
    expect(state.stack?.priorityPlayerId).toBe('a');
    state = passes(state);
    expect(effectiveMight(state.units[1]!)).toBe(6);
    state = passes(state);
    expect(effectiveMight(state.units[1]!)).toBe(5);
    expect(state.priorityPlayerId).toBe('b');
  });
  it('refuse timing, mauvaise priorité et paiement insuffisant sans mutation', () => {
    const input = scenario();
    const before = structuredClone(input);
    expect(act(input, cast('b', 'reinforce', 'ua')).ok).toBe(false);
    input.resources.a!.energy = 0;
    expect(act(input, cast('a', 'reinforce', 'ua')).ok).toBe(false);
    input.resources.a!.energy = 10;
    expect(input).toEqual(before);
    let pending = apply(input, cast('a', 'reinforce', 'ua'));
    expect(act(pending, cast('a', 'reposition', 'ua', 'field')).ok).toBe(false);
    expect(act(pending, cast('a', 'weaken-draw', 'ua')).ok).toBe(false);
    pending = apply(pending, { type: 'pass', playerId: 'a' });
    expect(act(pending, cast('a', 'reinforce', 'ua')).ok).toBe(false);
    const c = combat();
    expect(act(c, cast('a', 'weaken-draw', 'ub')).ok).toBe(false);
    const damage = passes(c);
    expect(act(damage, cast('a', 'reinforce', 'ua')).ok).toBe(false);
  });
  it('déplace une unité Tap sans la redresser et ouvre un Showdown seulement après la chaîne', () => {
    const input = scenario();
    const pending = apply(input, cast('a', 'reposition', 'ua', 'field'));
    expect(pending.showdown).toBeNull();
    const state = passes(pending);
    expect(state.units[0]).toMatchObject({ zoneId: 'field', ready: false });
    expect(state.showdown).toMatchObject({ kind: 'open', initiatorId: 'a' });
  });
  it('préserve aussi Ready lors du déplacement par effet', () => {
    const input = scenario();
    input.units[0]!.ready = true;
    expect(
      passes(apply(input, cast('a', 'reposition', 'ua', 'field'))).units[0]
        ?.ready,
    ).toBe(true);
  });
  it('transforme un Open Showdown en combat après arrivée adverse, sans changer le premier arrivé', () => {
    let state = scenario();
    state.units[0]!.zoneId = 'field';
    state.showdown = {
      kind: 'open',
      battlefieldId: 'field',
      initiatorId: 'a',
      participants: ['a', 'b'],
      priorityPlayerId: 'b',
      consecutivePasses: 1,
    };
    state = passes(apply(state, cast('b', 'reposition', 'ub', 'field')));
    expect(state.showdown).toMatchObject({
      kind: 'combat',
      initiatorId: 'a',
      defenderId: 'b',
      priorityPlayerId: 'a',
      consecutivePasses: 0,
    });
  });
  it('stun seulement un attaquant participant et supprime sa contribution aux dégâts', () => {
    let state = combat();
    state.showdown!.priorityPlayerId = 'b';
    expect(act(state, cast('b', 'stop-attacker', 'ub')).ok).toBe(false);
    state = passes(apply(state, cast('b', 'stop-attacker', 'ua')));
    expect(isStunned(state.units[0]!)).toBe(true);
    state = passes(state);
    expect(
      act(state, { type: 'assign-damage', playerId: 'a', allocations: [] }).ok,
    ).toBe(true);
    expect(
      act(state, {
        type: 'assign-damage',
        playerId: 'a',
        allocations: [{ targetId: 'ub', amount: 2 }],
      }).ok,
    ).toBe(false);
  });
  it('réévalue le ciblage à la résolution : un attaquant déplacé en base échappe au Stun', () => {
    let state = combat();
    state.showdown!.priorityPlayerId = 'b';
    state.spellDefinitions = [
      ...testSpells,
      { ...testSpells[0]!, timing: 'reaction' as const },
    ].filter((d, i, all) => all.findLastIndex((x) => x.id === d.id) === i);
    state = apply(state, cast('b', 'stop-attacker', 'ua'));
    state = apply(state, cast('a', 'reposition', 'ua', 'base-a'));
    state = passes(state);
    state = passes(state);
    expect(state.units[0]?.zoneId).toBe('base-a');
    expect(isStunned(state.units[0]!)).toBe(false);
  });
  it('expire bonus, malus et Stun à la fin du tour, sans modifier les valeurs de base', () => {
    let state = combat();
    state = passes(apply(state, cast('a', 'reinforce', 'ua')));
    state = passes(apply(state, cast('b', 'stop-attacker', 'ua')));
    expect(effectiveMight(state.units[0]!)).toBe(5);
    state = passes(state);
    state = apply(state, {
      type: 'assign-damage',
      playerId: 'a',
      allocations: [],
    });
    state = apply(state, {
      type: 'assign-damage',
      playerId: 'b',
      allocations: [{ targetId: 'ua', amount: 2 }],
    });
    state = apply(state, { type: 'end-turn', playerId: 'a' });
    expect(effectiveMight(state.units.find((u) => u.id === 'ua')!)).toBe(3);
    expect(isStunned(state.units.find((u) => u.id === 'ua')!)).toBe(false);
  });
  it('réutilise les règles de deck épuisé lors de la pioche d’un sort', () => {
    const input = scenario();
    input.cards = input.cards.filter((c) => c.zoneId !== 'deck-a');
    const result = passes(apply(input, cast('a', 'weaken-draw', 'ub')));
    // Le sort est encore en résolution et ne doit pas se recycler lui-même.
    expect(result.result?.winnerId).toBe('b');
    expect(result.players[1]?.score).toBe(8);
  });
});
