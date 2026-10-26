import { withDrawSupplies } from './test-fixtures.js';
import { describe, expect, it } from 'vitest';
import { act, type GameState } from './index.js';

/** Entrée de référence : une Main terminable, avec du score mémorisé pour ce tour. */
function mainState(): GameState {
  return withDrawSupplies({
    activePlayerId: 'alice',
    phase: 'main',
    cards: [],
    resources: {
      alice: { energy: 0, power: {} },
      bob: { energy: 0, power: {} },
    },
    players: [
      { id: 'alice', score: 2 },
      { id: 'bob', score: 1 },
    ],
    zones: [],
    units: [],
    battlefields: [],
    scoredBattlefields: { alice: ['ruins'], bob: ['forest'] },
    showdown: null,
  });
}

describe('fin du tour', () => {
  it('passe au début du tour suivant et remet à zéro le registre sans modifier la source', () => {
    const state = mainState();
    const result = act(state, { type: 'end-turn', playerId: 'alice' });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.state).toEqual({
      ...state,
      priorityPlayerId: 'bob',
      cards: state.cards.map((card) =>
        card.id === 'card-bob-0' ? { ...card, zoneId: 'hand-bob' } : card,
      ),
      activePlayerId: 'bob',
      phase: 'main',
      scoredBattlefields: { alice: [], bob: [] },
    });
    expect(
      result.events.filter(
        (event) => event.type === 'turn-ended' || event.type === 'turn-started',
      ),
    ).toEqual([
      { type: 'turn-ended', playerId: 'alice' },
      { type: 'turn-started', playerId: 'bob' },
    ]);
    expect(state).toEqual(mainState());
  });

  it('refuse de terminer le tour d’un autre joueur', () => {
    expect(act(mainState(), { type: 'end-turn', playerId: 'bob' })).toEqual({
      ok: false,
      reason: 'NOT_ACTIVE_PLAYER',
    });
  });

  it('refuse la fin du tour pendant un Showdown', () => {
    const state = mainState();
    state.zones = [{ id: 'ruins', kind: 'battlefield' }];
    state.battlefields = [{ zoneId: 'ruins', controllerId: null }];
    state.units = [
      {
        id: 'knight',
        definitionId: 'fixture',
        might: 1,
        damage: 0,
        ownerId: 'alice',
        zoneId: 'ruins',
        ready: false,
      },
    ];
    state.showdown = {
      kind: 'open',
      battlefieldId: 'ruins',
      initiatorId: 'alice',
      participants: ['alice', 'bob'],
      priorityPlayerId: 'alice',
      consecutivePasses: 0,
    };
    const before = structuredClone(state);
    expect(act(state, { type: 'end-turn', playerId: 'alice' })).toEqual({
      ok: false,
      reason: 'SHOWDOWN_IN_PROGRESS',
    });
    expect(state).toEqual(before);
  });

  it('revient au premier joueur après le dernier et respecte un ordre de trois joueurs', () => {
    const state = mainState();
    state.players.push({ id: 'charlie', score: 0 });
    state.zones.push(
      { id: 'deck-charlie', kind: 'deck', ownerId: 'charlie' },
      { id: 'hand-charlie', kind: 'hand', ownerId: 'charlie' },
    );
    state.cards.push({
      id: 'charlie-card',
      definitionId: 'fixture',
      ownerId: 'charlie',
      zoneId: 'deck-charlie',
    });
    state.activePlayerId = 'bob';
    const next = act(state, { type: 'end-turn', playerId: 'bob' });
    expect(next.ok).toBe(true);
    if (!next.ok) throw new Error(next.reason);
    expect(next.state.activePlayerId).toBe('charlie');
    const wrapped = act(next.state, { type: 'end-turn', playerId: 'charlie' });
    expect(wrapped.ok).toBe(true);
    if (!wrapped.ok) throw new Error(wrapped.reason);
    expect(wrapped.state.activePlayerId).toBe('alice');
  });

  it('refuse une demande de fin de tour depuis une étape automatique', () => {
    const state = { ...mainState(), phase: 'awaken' as const };
    expect(act(state, { type: 'end-turn', playerId: 'alice' })).toEqual({
      ok: false,
      reason: 'NOT_MAIN_PHASE',
    });
  });
});
