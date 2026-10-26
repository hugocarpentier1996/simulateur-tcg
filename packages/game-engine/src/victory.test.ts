import { describe, expect, it } from 'vitest';
import { act, type GameState, type GameAction } from './index.js';
import { withDrawSupplies } from './test-fixtures.js';

function scenario(): GameState {
  return withDrawSupplies({
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 7 },
      { id: 'b', score: 0 },
    ],
    zones: ['f1', 'f2', 'f3'].map((id) => ({
      id,
      kind: 'battlefield' as const,
    })),
    units: [
      {
        id: 'u',
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'f1',
        ready: false,
        might: 3,
        damage: 0,
      },
    ],
    cards: [],
    resources: {},
    battlefields: ['f1', 'f2', 'f3'].map((zoneId) => ({
      zoneId,
      controllerId: null,
    })),
    scoredBattlefields: {},
    showdown: {
      kind: 'open',
      battlefieldId: 'f1',
      initiatorId: 'a',
      participants: ['a', 'b'],
      priorityPlayerId: 'b',
      consecutivePasses: 1,
    },
  });
}
function apply(state: GameState, action: GameAction) {
  const result = act(state, action);
  if (!result.ok) throw new Error(result.reason);
  return result;
}
const close = (state: GameState) =>
  apply(state, { type: 'pass', playerId: 'b' });

describe('victoire et dernier point de conquête', () => {
  it('remplace le huitième point par une pioche et inscrit le champ sans muter la source', () => {
    const input = scenario();
    const before = structuredClone(input);
    const { state, events } = close(input);
    expect(state.players[0]?.score).toBe(7);
    expect(state.result).toBeUndefined();
    expect(state.scoredBattlefields.a).toEqual(['f1']);
    expect(state.battlefields[0]?.controllerId).toBe('a');
    expect(state.cards.find((c) => c.id === 'card-a-0')?.zoneId).toBe('hand-a');
    expect(events.map((e) => e.type)).toContain('conquest-point-replaced');
    expect(events.map((e) => e.type)).not.toContain('point-scored');
    expect(input).toEqual(before);
  });
  it('gagne par conquête quand tous les autres champs ont été scorés ce tour', () => {
    const input = scenario();
    input.scoredBattlefields.a = ['f2', 'f3'];
    const { state, events } = close(input);
    expect(state.players[0]?.score).toBe(8);
    expect(state.result).toEqual({ winnerId: 'a', reason: 'POINTS' });
    expect(events.at(-1)).toEqual({
      type: 'game-ended',
      winnerId: 'a',
      reason: 'POINTS',
    });
    expect(events.some((e) => e.type === 'card-drawn')).toBe(false);
    expect(act(state, { type: 'end-turn', playerId: 'a' })).toEqual({
      ok: false,
      reason: 'GAME_OVER',
    });
  });
  it('compte les conquêtes remplacées pour autoriser la victoire sur le dernier champ', () => {
    let state = scenario();
    for (const field of ['f1', 'f2', 'f3']) {
      state = {
        ...state,
        units: state.units.map((u) => ({ ...u, zoneId: field })),
        showdown: { ...scenario().showdown!, battlefieldId: field },
      };
      state = close(state).state;
    }
    expect(state.players[0]?.score).toBe(8);
    expect(state.result?.winnerId).toBe('a');
    expect(state.cards.filter((c) => c.zoneId === 'hand-a')).toHaveLength(2);
  });
  it('ne donne ni deuxième point ni deuxième pioche pour un champ déjà scoré', () => {
    const input = scenario();
    input.scoredBattlefields.a = ['f1', 'f2', 'f3'];
    const { state, events } = close(input);
    expect(state.players[0]?.score).toBe(7);
    expect(state.cards).toEqual(input.cards);
    expect(
      events.some(
        (e) =>
          e.type === 'point-scored' || e.type === 'conquest-point-replaced',
      ),
    ).toBe(false);
  });
  it('score normalement avant le dernier point, même sans avoir scoré les autres champs', () => {
    const input = scenario();
    input.players[0]!.score = 6;
    const { state } = close(input);
    expect(state.players[0]?.score).toBe(7);
    expect(state.cards).toEqual(input.cards);
  });
  it('gagne sur un champ unique sans autre condition de conquête', () => {
    const input = scenario();
    input.battlefields = input.battlefields.slice(0, 1);
    expect(close(input).state.result?.winnerId).toBe('a');
  });
  it('fait piocher le conquérant même lorsque ce n’est pas son tour', () => {
    const input = scenario();
    input.activePlayerId = 'b';
    const { state } = close(input);
    expect(state.activePlayerId).toBe('b');
    expect(state.cards.find((c) => c.id === 'card-a-0')?.zoneId).toBe('hand-a');
  });
  it('applique la défaite par deck vide à la pioche de remplacement', () => {
    const input = scenario();
    input.cards = input.cards.filter((c) => c.ownerId !== 'a');
    const { state } = close(input);
    expect(state.result).toEqual({
      winnerId: 'b',
      loserId: 'a',
      reason: 'DECK_EXHAUSTION',
    });
    expect(state.scoredBattlefields.a).toEqual(['f1']);
    expect(state.players[0]?.score).toBe(7);
  });
  it('applique aussi la restriction après un combat gagné', () => {
    const input = scenario();
    input.showdown = {
      ...input.showdown!,
      kind: 'combat',
      defenderId: 'b',
      stage: 'damage',
      assignments: { a: [] },
    };
    const { state } = apply(input, {
      type: 'assign-damage',
      playerId: 'b',
      allocations: [],
    });
    expect(state.players[0]?.score).toBe(7);
    expect(state.scoredBattlefields.a).toEqual(['f1']);
    expect(state.cards.find((c) => c.id === 'card-a-0')?.zoneId).toBe('hand-a');
  });
  it('gagne par tenue au Beginning et arrête les étapes automatiques immédiatement', () => {
    const input = scenario();
    input.showdown = null;
    input.activePlayerId = 'b';
    input.battlefields.forEach((f) => {
      f.controllerId = 'a';
    });
    const { state, events } = apply(input, { type: 'end-turn', playerId: 'b' });
    expect(state.result).toEqual({ winnerId: 'a', reason: 'POINTS' });
    expect(state.players[0]?.score).toBe(8);
    expect(state.phase).toBe('beginning');
    expect(state.scoredBattlefields.a).toEqual(['f1']);
    expect(
      events.some(
        (e) => e.type === 'card-drawn' || e.type === 'runes-channeled',
      ),
    ).toBe(false);
  });
});
