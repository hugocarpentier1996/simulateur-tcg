import { expect, it } from 'vitest';
import { act, type GameState, type GameAction } from './index.js';
import { flash, mightOfDemacia } from '../../game-data/src/index.js';
const legend = mightOfDemacia;
function fixture(count = 4): GameState {
  return {
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    activePlayerId: 'a',
    phase: 'main',
    resources: { a: { energy: 2, power: {} } },
    zones: [
      { id: 'f', kind: 'battlefield' },
      ...['a', 'b'].flatMap((ownerId) =>
        (['base', 'legend', 'deck', 'hand', 'graveyard'] as const).map(
          (kind) => ({ id: `${kind}-${ownerId}`, kind, ownerId }),
        ),
      ),
    ],
    cards: [
      {
        id: 'legend',
        definitionId: legend.id,
        ownerId: 'a',
        zoneId: 'legend-a',
      },
      ...['one', 'two'].map((id) => ({
        id,
        definitionId: 'test',
        ownerId: 'a',
        zoneId: 'deck-a',
      })),
      { id: 'flash', definitionId: flash.id, ownerId: 'a', zoneId: 'hand-a' },
    ],
    units: Array.from({ length: count }, (_, i) => ({
      id: `u${i}`,
      definitionId: 'test',
      ownerId: 'a',
      zoneId: 'f',
      ready: false,
      might: 2,
      damage: 0,
    })),
    legendDefinitions: [legend],
    spellDefinitions: [flash],
    battlefields: [{ zoneId: 'f', controllerId: null }],
    scoredBattlefields: {},
    showdown: {
      kind: 'open',
      battlefieldId: 'f',
      initiatorId: 'a',
      participants: ['a', 'b'],
      priorityPlayerId: 'a',
      consecutivePasses: 0,
    },
  };
}
function step(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}
function passes(s: GameState) {
  s = step(s, {
    type: 'pass',
    playerId: s.stack?.priorityPlayerId ?? s.showdown!.priorityPlayerId,
  });
  return step(s, {
    type: 'pass',
    playerId: s.stack?.priorityPlayerId ?? s.showdown!.priorityPlayerId,
  });
}
it('conquiert puis empile draw 2, même si ce champ a déjà scoré ce tour', () => {
  for (const scored of [false, true]) {
    const s = fixture();
    if (scored) s.scoredBattlefields = { a: ['f'] };
    let next = passes(s);
    expect(next.players[0]!.score).toBe(scored ? 0 : 1);
    expect(next.stack?.entries).toHaveLength(1);
    expect(next.showdown).toBeNull();
    next = passes(next);
    expect(next.cards.filter((c) => c.zoneId === 'hand-a')).toHaveLength(3);
  }
});
it('vérifie le seuil à la conquête et après la réaction Flash', () => {
  expect(passes(fixture(3)).stack ?? null).toBeNull();
  let s = passes(fixture());
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'flash',
    targetId: 'a',
    selectedUnitIds: ['u0', 'u1'],
    payment: { energyRunes: [], powerRunes: [] },
  });
  s = passes(passes(s));
  expect(s.cards.filter((c) => c.zoneId === 'deck-a')).toHaveLength(2);
});
it('la victoire interrompt le déclenchement de pioche', () => {
  const s = fixture();
  s.players[0]!.score = 7;
  const next = passes(s);
  expect(next.result).toMatchObject({ winnerId: 'a' });
  expect(next.stack ?? null).toBeNull();
});

it('déclenche aussi après un combat gagné avec quatre survivants', () => {
  let s = fixture();
  s.battlefields[0]!.controllerId = 'b';
  s.units.push({
    id: 'enemy',
    definitionId: 'test',
    ownerId: 'b',
    zoneId: 'f',
    ready: false,
    might: 1,
    damage: 0,
  });
  s.showdown = {
    kind: 'combat',
    battlefieldId: 'f',
    initiatorId: 'a',
    defenderId: 'b',
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
    stage: 'priority',
    assignments: {},
  };
  s = passes(s);
  s = step(s, {
    type: 'assign-damage',
    playerId: 'a',
    allocations: [{ targetId: 'enemy', amount: 1 }],
  });
  s = step(s, {
    type: 'assign-damage',
    playerId: 'b',
    allocations: [{ targetId: 'u0', amount: 1 }],
  });
  expect(s.stack?.entries).toHaveLength(1);
  expect(s.showdown).toBeNull();
  expect(passes(s).cards.filter((c) => c.zoneId === 'hand-a')).toHaveLength(3);
});
