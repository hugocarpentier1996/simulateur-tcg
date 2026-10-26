import { describe, expect, it } from 'vitest';
import {
  act,
  type GameState,
  type GameAction,
  type GameEvent,
} from './index.js';
import { deathTestUnits, testSpells } from '../../game-data/src/index.js';
import { withDrawSupplies } from './test-fixtures.js';

export function deathScenario(might = 4): GameState {
  return withDrawSupplies({
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    unitDefinitions: deathTestUnits,
    spellDefinitions: testSpells,
    zones: [
      ...['a', 'b'].flatMap((ownerId) => [
        { id: `base-${ownerId}`, ownerId, kind: 'base' as const },
        { id: `grave-${ownerId}`, ownerId, kind: 'graveyard' as const },
        { id: `champ-${ownerId}`, ownerId, kind: 'champion' as const },
      ]),
      ...['field', 'home', 'neutral'].map((id) => ({
        id,
        kind: 'battlefield' as const,
      })),
    ],
    cards: [
      { id: 'champ', definitionId: 'reborn', ownerId: 'a', zoneId: 'champ-a' },
      {
        id: 'hand-unit',
        definitionId: 'reborn',
        ownerId: 'a',
        zoneId: 'hand-a',
      },
      {
        id: 'buff',
        definitionId: 'test-reinforce',
        ownerId: 'a',
        zoneId: 'hand-a',
      },
    ],
    units: [
      {
        id: 'attacker',
        definitionId: 'plain',
        ownerId: 'a',
        zoneId: 'field',
        ready: false,
        might,
        damage: 0,
      },
      {
        id: 'defender',
        definitionId: 'reborn',
        ownerId: 'b',
        zoneId: 'field',
        ready: false,
        might: 1,
        damage: 0,
      },
    ],
    resources: {
      a: { energy: 10, power: { 'color-1': 10 } },
      b: { energy: 10, power: {} },
    },
    battlefields: [
      { zoneId: 'field', controllerId: 'b' },
      { zoneId: 'home', controllerId: 'a' },
      { zoneId: 'neutral', controllerId: null },
    ],
    scoredBattlefields: {},
    showdown: {
      kind: 'combat',
      battlefieldId: 'field',
      initiatorId: 'a',
      defenderId: 'b',
      participants: ['a', 'b'],
      priorityPlayerId: 'a',
      consecutivePasses: 0,
      stage: 'priority',
      assignments: {},
    },
  });
}
function step(
  state: GameState,
  action: GameAction,
  events: GameEvent[] = [],
): GameState {
  const r = act(state, action);
  if (!r.ok) throw new Error(r.reason);
  events.push(...r.events);
  return r.state;
}
function passes(s: GameState, events: GameEvent[] = []) {
  for (const playerId of ['a', 'b'])
    s = step(s, { type: 'pass', playerId }, events);
  return s;
}
function firstCombat(might: number, events: GameEvent[] = []) {
  let s = passes(deathScenario(might), events);
  s = step(
    s,
    {
      type: 'assign-damage',
      playerId: 'a',
      allocations: [{ targetId: 'defender', amount: 1 }],
    },
    events,
  );
  return step(
    s,
    {
      type: 'assign-damage',
      playerId: 'b',
      allocations: [{ targetId: 'attacker', amount: 1 }],
    },
    events,
  );
}

describe('mort, invocation et second combat', () => {
  it('ne déclare pas une victoire prématurée à 7 points avant le second combat', () => {
    let s = deathScenario(2);
    s.players[0]!.score = 7;
    s.scoredBattlefields.a = ['home', 'neutral'];
    s = passes(s);
    s = step(s, {
      type: 'assign-damage',
      playerId: 'a',
      allocations: [{ targetId: 'defender', amount: 1 }],
    });
    s = step(s, {
      type: 'assign-damage',
      playerId: 'b',
      allocations: [{ targetId: 'attacker', amount: 1 }],
    });
    expect(s.result).toBeUndefined();
    expect(s.players[0]?.score).toBe(7);
    s = passes(
      step(s, {
        type: 'queue-death-effects',
        playerId: 'b',
        effects: [{ sourceId: 'defender', destinationId: 'field' }],
      }),
    );
    const token = s.units.find((u) => u.token)!;
    s = passes(s);
    s = step(s, {
      type: 'assign-damage',
      playerId: 'a',
      allocations: [{ targetId: token.id, amount: 2 }],
    });
    s = step(s, {
      type: 'assign-damage',
      playerId: 'b',
      allocations: [{ targetId: 'attacker', amount: 2 }],
    });
    expect(s.result).toBeUndefined();
    expect(s.players[0]?.score).toBe(7);
  });
  it('respecte l’ordre choisi de plusieurs morts et ne relance pas si le défenseur n’a jamais été éliminé', () => {
    let s = deathScenario(4);
    s.units.push({ ...s.units[1]!, id: 'defender2' });
    s = passes(s);
    s = step(s, {
      type: 'assign-damage',
      playerId: 'a',
      allocations: [
        { targetId: 'defender', amount: 1 },
        { targetId: 'defender2', amount: 1 },
      ],
    });
    s = step(s, {
      type: 'assign-damage',
      playerId: 'b',
      allocations: [{ targetId: 'attacker', amount: 2 }],
    });
    expect(
      act(s, {
        type: 'queue-death-effects',
        playerId: 'b',
        effects: [{ sourceId: 'defender', destinationId: 'field' }],
      }).ok,
    ).toBe(false);
    s = step(s, {
      type: 'queue-death-effects',
      playerId: 'b',
      effects: [
        { sourceId: 'defender2', destinationId: 'field' },
        { sourceId: 'defender', destinationId: 'base-b' },
      ],
    });
    s = passes(s);
    expect(s.units.find((u) => u.token)?.zoneId).toBe('base-b');
    expect(s.stack?.priorityPlayerId).toBe('a');
    s = passes(s);
    expect(s.showdown).toMatchObject({ stage: 'priority' });
    let other = deathScenario(2);
    other.units[1]!.stunned = true;
    other.units.push({
      ...other.units[1]!,
      id: 'bodyguard',
      definitionId: 'plain',
      might: 4,
    });
    // Un défenseur conservé : la disparition d'une autre unité ne suffit pas à relancer.
    other = passes(other);
    other = step(other, {
      type: 'assign-damage',
      playerId: 'a',
      allocations: [
        { targetId: 'defender', amount: 1 },
        { targetId: 'bodyguard', amount: 1 },
      ],
    });
    other = step(other, {
      type: 'assign-damage',
      playerId: 'b',
      allocations: [],
    });
    other = passes(
      step(other, {
        type: 'queue-death-effects',
        playerId: 'b',
        effects: [{ sourceId: 'defender', destinationId: 'field' }],
      }),
    );
    expect(other.showdown).toBeNull();
    expect(other.units.find((u) => u.id === 'attacker')?.zoneId).toBe('base-a');
    expect(other.players[0]?.score).toBe(0);
  });
  it.each([4, 2])(
    'ne score qu’après les deux combats si l’attaquant de Might %i survit',
    (might) => {
      const events: GameEvent[] = [];
      let s = firstCombat(might, events);
      expect(s.players[0]?.score).toBe(0);
      expect(s.battlefields[0]?.controllerId).toBe('b');
      expect(s.cards.find((c) => c.id === 'defender')?.zoneId).toBe('grave-b');
      expect(s.units[0]?.damage).toBe(0);
      s = step(
        s,
        {
          type: 'queue-death-effects',
          playerId: 'b',
          effects: [{ sourceId: 'defender', destinationId: 'field' }],
        },
        events,
      );
      expect(s.players[0]?.score).toBe(0);
      s = passes(s, events);
      expect(s.showdown).toMatchObject({
        kind: 'combat',
        stage: 'priority',
        initiatorId: 'a',
        defenderId: 'b',
        priorityPlayerId: 'a',
      });
      expect(s.players[0]?.score).toBe(0);
      expect(s.scoredBattlefields.a ?? []).toEqual([]);
      const token = s.units.find((u) => u.token)!;
      expect(token).toMatchObject({ might: 3, ready: false, zoneId: 'field' });
      s = passes(s, events);
      s = step(
        s,
        {
          type: 'assign-damage',
          playerId: 'a',
          allocations: [{ targetId: token.id, amount: Math.min(might, 3) }],
        },
        events,
      );
      s = step(
        s,
        {
          type: 'assign-damage',
          playerId: 'b',
          allocations: [{ targetId: 'attacker', amount: Math.min(might, 3) }],
        },
        events,
      );
      expect(s.players[0]?.score).toBe(might === 4 ? 1 : 0);
      expect(s.battlefields[0]?.controllerId).toBe(might === 4 ? 'a' : 'b');
      expect(events.filter((e) => e.type === 'combat-damage')).toHaveLength(2);
      expect(events.filter((e) => e.type === 'combat-restarted')).toHaveLength(
        1,
      );
      expect(s.cards.some((c) => c.id === token.id)).toBe(false);
    },
  );
  it('interdit à l’attaquant d’invoquer sur le champ défendu et autorise base ou autre champ contrôlé', () => {
    const input = deathScenario(1);
    input.units[0]!.definitionId = 'reborn';
    input.units[1]!.definitionId = 'plain';
    input.units[1]!.might = 4;
    let s = passes(input);
    s = step(s, {
      type: 'assign-damage',
      playerId: 'a',
      allocations: [{ targetId: 'defender', amount: 1 }],
    });
    s = step(s, {
      type: 'assign-damage',
      playerId: 'b',
      allocations: [{ targetId: 'attacker', amount: 1 }],
    });
    expect(
      act(s, {
        type: 'queue-death-effects',
        playerId: 'a',
        effects: [{ sourceId: 'attacker', destinationId: 'field' }],
      }).ok,
    ).toBe(false);
    for (const destinationId of ['base-a', 'home']) {
      const n = passes(
        step(s, {
          type: 'queue-death-effects',
          playerId: 'a',
          effects: [{ sourceId: 'attacker', destinationId }],
        }),
      );
      expect(n.units.find((u) => u.token)?.zoneId).toBe(destinationId);
      expect(n.players[0]?.score).toBe(0);
    }
  });
  it('autorise une Réaction à la mort et garde la conquête suspendue jusqu’à la fin de la pile', () => {
    let s = firstCombat(2);
    s = step(s, {
      type: 'queue-death-effects',
      playerId: 'b',
      effects: [{ sourceId: 'defender', destinationId: 'field' }],
    });
    s = step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'buff',
      targetId: 'attacker',
      payment: { energyRunes: [], powerRunes: [] },
    });
    s = passes(s);
    expect(s.stack?.entries).toHaveLength(1);
    expect(s.units.some((u) => u.token)).toBe(false);
    expect(s.players[0]?.score).toBe(0);
    s = passes(s);
    expect(s.showdown).toMatchObject({ stage: 'priority' });
    expect(s.units.some((u) => u.token)).toBe(true);
  });
  it('empile les effets attaquants avant les défenseurs et laisse chaque propriétaire ordonner ses effets', () => {
    let s = deathScenario(1);
    s.units[0]!.definitionId = 'reborn';
    s = passes(s);
    s = step(s, {
      type: 'assign-damage',
      playerId: 'a',
      allocations: [{ targetId: 'defender', amount: 1 }],
    });
    s = step(s, {
      type: 'assign-damage',
      playerId: 'b',
      allocations: [{ targetId: 'attacker', amount: 1 }],
    });
    expect(
      act(s, {
        type: 'queue-death-effects',
        playerId: 'b',
        effects: [{ sourceId: 'defender', destinationId: 'field' }],
      }).ok,
    ).toBe(false);
    s = step(s, {
      type: 'queue-death-effects',
      playerId: 'a',
      effects: [{ sourceId: 'attacker', destinationId: 'base-a' }],
    });
    s = step(s, {
      type: 'queue-death-effects',
      playerId: 'b',
      effects: [{ sourceId: 'defender', destinationId: 'field' }],
    });
    s = passes(s);
    expect(s.units.filter((u) => u.token).map((u) => u.ownerId)).toEqual(['b']);
    s = passes(s);
    expect(s.units.filter((u) => u.token)).toHaveLength(2);
    expect(s.showdown).toBeNull();
    expect(s.players[0]?.score).toBe(0);
  });
  it.each(['field', 'neutral', 'base-b'])(
    'refuse une unité depuis la main vers %s sans modifier la partie',
    (destinationId) => {
      const input = deathScenario();
      input.showdown = null;
      const before = structuredClone(input);

      expect(
        act(input, {
          type: 'play-unit',
          playerId: 'a',
          cardId: 'hand-unit',
          destinationId,
          payment: { energyRunes: [], powerRunes: [] },
        }),
      ).toEqual({ ok: false, reason: 'INVALID_SUMMON_DESTINATION' });
      expect(input).toEqual(before);
    },
  );

  it('joue main et chosen champion Tap seulement en base ou sur un champ contrôlé', () => {
    const input = deathScenario();
    input.showdown = null;
    for (const cardId of ['hand-unit', 'champ'])
      for (const destinationId of ['base-a', 'home']) {
        const s = step(input, {
          type: 'play-unit',
          playerId: 'a',
          cardId,
          destinationId,
          payment: { energyRunes: [], powerRunes: [] },
        });
        expect(s.units.find((u) => u.id === cardId)).toMatchObject({
          ready: false,
          zoneId: destinationId,
        });
        expect(s.cards.some((c) => c.id === cardId)).toBe(false);
      }
    for (const destinationId of ['field', 'neutral', 'base-b'])
      expect(
        act(input, {
          type: 'play-unit',
          playerId: 'a',
          cardId: 'champ',
          destinationId,
          payment: { energyRunes: [], powerRunes: [] },
        }).ok,
      ).toBe(false);
  });
});
