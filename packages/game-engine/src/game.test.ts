import { withDrawSupplies } from './test-fixtures.js';
import { describe, expect, it } from 'vitest';
import { act, type GameState } from './index.js';

/*
 * Contrats vérifiés : chaque test prépare un état et une intention en entrée,
 * appelle `act`, puis compare la sortie aux attentes via `expect`.
 * Les succès vérifient l'état et/ou les événements ; les refus vérifient `ok`
 * et, lorsqu'il est pertinent, le code `reason`. Aucun serveur n'est nécessaire.
 */

/** Situation de départ indépendante pour chaque test : Alice active, unité Ready, champ vide. */
function initialState(): GameState {
  return withDrawSupplies({
    activePlayerId: 'alice',
    phase: 'main',
    cards: [],
    resources: {
      alice: { energy: 0, power: {} },
      bob: { energy: 0, power: {} },
    },
    players: [
      { id: 'alice', score: 0 },
      { id: 'bob', score: 0 },
    ],
    zones: [
      { id: 'base-alice', kind: 'base', ownerId: 'alice' },
      { id: 'field', kind: 'battlefield' },
    ],
    units: [
      {
        id: 'u1',
        definitionId: 'fixture',
        might: 1,
        damage: 0,
        ownerId: 'alice',
        zoneId: 'base-alice',
        ready: true,
      },
    ],
    battlefields: [{ zoneId: 'field', controllerId: null }],
    scoredBattlefields: { alice: [], bob: [] },
    showdown: null,
  });
}

describe('première tranche : mouvement et conquête', () => {
  it('déplace et tap une unité, puis ouvre un showdown sans muter la source', () => {
    const state = initialState();
    const result = act(state, {
      type: 'move',
      playerId: 'alice',
      unitId: 'u1',
      destinationId: 'field',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.state.units[0]).toMatchObject({
      zoneId: 'field',
      ready: false,
    });
    expect(result.state.showdown).toMatchObject({
      initiatorId: 'alice',
      priorityPlayerId: 'alice',
      participants: ['alice', 'bob'],
    });
    expect(result.events.map((event) => event.type)).toEqual([
      'unit-moved',
      'showdown-opened',
    ]);
    expect(state).toEqual(initialState());
  });

  it('attend les passes de tous les participants avant de conquérir et scorer', () => {
    let state = initialState();
    const actions = [
      { type: 'move', playerId: 'alice', unitId: 'u1', destinationId: 'field' },
      { type: 'pass', playerId: 'alice' },
      { type: 'pass', playerId: 'bob' },
    ] as const;
    for (const action of actions) {
      const result = act(state, action);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.reason);
      state = result.state;
    }
    expect(state.showdown).toBeNull();
    expect(state.battlefields[0]?.controllerId).toBe('alice');
    expect(state.players[0]?.score).toBe(1);
    expect(state.scoredBattlefields.alice).toEqual(['field']);
  });

  it('refuse une unité tap sans modifier la partie', () => {
    const state = initialState();
    state.units[0]!.ready = false;
    expect(
      act(state, {
        type: 'move',
        playerId: 'alice',
        unitId: 'u1',
        destinationId: 'field',
      }),
    ).toEqual({ ok: false, reason: 'UNIT_NOT_READY' });
  });

  it('refuse une action du mauvais joueur ou une destination inconnue', () => {
    const state = initialState();
    expect(
      act(state, {
        type: 'move',
        playerId: 'bob',
        unitId: 'u1',
        destinationId: 'field',
      }).ok,
    ).toBe(false);
    expect(
      act(state, {
        type: 'move',
        playerId: 'alice',
        unitId: 'u1',
        destinationId: 'missing',
      }).ok,
    ).toBe(false);
  });

  it('refuse de passer hors priorité', () => {
    const moved = act(initialState(), {
      type: 'move',
      playerId: 'alice',
      unitId: 'u1',
      destinationId: 'field',
    });
    if (!moved.ok) throw new Error(moved.reason);
    expect(act(moved.state, { type: 'pass', playerId: 'bob' })).toEqual({
      ok: false,
      reason: 'NO_PRIORITY',
    });
  });

  it('ne score pas deux fois sur le même champ pendant le tour', () => {
    const state = initialState();
    state.scoredBattlefields.alice = ['field'];
    let current = state;
    for (const action of [
      { type: 'move', playerId: 'alice', unitId: 'u1', destinationId: 'field' },
      { type: 'pass', playerId: 'alice' },
      { type: 'pass', playerId: 'bob' },
    ] as const) {
      const result = act(current, action);
      if (!result.ok) throw new Error(result.reason);
      current = result.state;
    }
    expect(current.players[0]?.score).toBe(0);
    expect(current.battlefields[0]?.controllerId).toBe('alice');
  });

  it('termine le tour après la conquête et conserve le point acquis', () => {
    let state = initialState();
    for (const action of [
      { type: 'move', playerId: 'alice', unitId: 'u1', destinationId: 'field' },
      { type: 'pass', playerId: 'alice' },
      { type: 'pass', playerId: 'bob' },
      { type: 'end-turn', playerId: 'alice' },
    ] as const) {
      const result = act(state, action);
      if (!result.ok) throw new Error(result.reason);
      state = result.state;
    }
    expect(state.activePlayerId).toBe('bob');
    expect(state.phase).toBe('main');
    expect(state.players[0]?.score).toBe(1);
    expect(state.battlefields[0]?.controllerId).toBe('alice');
    expect(state.scoredBattlefields).toEqual({ alice: [], bob: [] });
    expect(state.units[0]?.ready).toBe(false);
  });
});
