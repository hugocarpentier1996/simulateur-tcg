import { expect, it } from 'vitest';
import {
  act,
  createGame,
  recordOpeningRoll,
  getLegalActions,
  type GameAction,
  type GameEvent,
} from './index.js';
import {
  deathTestUnits,
  testGears,
  testSpells,
} from '../../game-data/src/index.js';

it('joue une partie BO1 complète : préparation, champions, gear, Réaction, deux combats et victoire à 8', () => {
  const created = createGame({
    randomState: 73,
    unitDefinitions: [
      ...deathTestUnits,
      {
        id: 'champion',
        type: 'unit',
        might: 4,
        cost: { energy: 2, power: {} },
      },
    ],
    gearDefinitions: testGears,
    spellDefinitions: testSpells.map((d) => ({
      ...d,
      cost: { energy: d.cost.energy, power: { rouge: 1 } },
    })),
    players: ['a', 'b'].map((id) => ({
      id,
      deck: Array.from({ length: 39 }, (_, i) => ({
        id: `${id}-card-${i}`,
        definitionId:
          i === 0 ? 'banner' : i === 1 ? 'test-reinforce' : 'reborn',
      })),
      runes: Array.from({ length: 12 }, (_, i) => ({
        id: `${id}-rune-${i}`,
        definitionId: 'rune',
        color: 'rouge',
      })),
      legend: {
        id: `${id}-legend`,
        definitionId: 'legend',
        colors: ['rouge', 'bleu'],
      },
      champion: {
        id: `${id}-chosen`,
        definitionId: id === 'a' ? 'champion' : 'reborn',
      },
      battlefields: [0, 1, 2].map((i) => ({
        id: `${id}-field-${i}`,
        definitionId: `field-${i}`,
      })),
    })),
  });
  if (!created.ok) throw new Error(created.reason);
  const rolled = recordOpeningRoll(created.state, { a: 19, b: 8 });
  if (!rolled.ok) throw new Error(rolled.reason);
  let state = rolled.state;
  const transcript: GameAction[] = [];
  const events: GameEvent[] = [...created.events, ...rolled.events];
  function play(playerId: string, predicate: (a: GameAction) => boolean) {
    const action = getLegalActions(state, playerId).find(predicate);
    expect(action, `Action disponible pour ${playerId}`).toBeDefined();
    const r = act(state, action!);
    if (!r.ok) throw new Error(r.reason);
    state = r.state;
    transcript.push(action!);
    events.push(...r.events);
  }
  function pass(playerId: string) {
    play(playerId, (a) => a.type === 'pass');
  }
  function end(playerId: string) {
    play(playerId, (a) => a.type === 'end-turn');
  }
  play('a', (a) => a.type === 'choose-first-player' && a.firstPlayerId === 'a');
  for (const id of ['a', 'b'])
    play(id, (a) => a.type === 'mulligan' && a.cardIds.length === 0);
  play('a', (a) => a.type === 'play-unit' && a.cardId === 'a-chosen');
  end('a');
  play('b', (a) => a.type === 'play-unit' && a.cardId === 'b-chosen');
  end('b');
  play('a', (a) => a.type === 'play-gear' && a.cardId === 'a-card-0');
  end('a');
  const field = state.battlefields[0]!.zoneId;
  play(
    'b',
    (a) =>
      a.type === 'move' && a.unitId === 'b-chosen' && a.destinationId === field,
  );
  pass('b');
  pass('a');
  end('b');
  play(
    'a',
    (a) =>
      a.type === 'move' && a.unitId === 'a-chosen' && a.destinationId === field,
  );
  play(
    'a',
    (a) =>
      a.type === 'cast-spell' &&
      a.cardId === 'a-card-1' &&
      a.targetId === 'a-chosen',
  );
  pass('a');
  pass('b');
  pass('b');
  pass('a');
  play('a', (a) => a.type === 'assign-damage');
  play('b', (a) => a.type === 'assign-damage');
  expect(state.players.find((p) => p.id === 'a')?.score).toBe(0);
  play(
    'b',
    (a) =>
      a.type === 'queue-death-effects' &&
      a.effects.every((e) => e.destinationId === field),
  );
  pass('a');
  pass('b');
  expect(state.players.find((p) => p.id === 'a')?.score).toBe(0);
  pass('a');
  pass('b');
  play('a', (a) => a.type === 'assign-damage');
  play('b', (a) => a.type === 'assign-damage');
  expect(state.players.find((p) => p.id === 'a')?.score).toBe(1);
  for (let turns = 0; !state.result && turns < 30; turns++)
    end(state.activePlayerId);
  expect(state.result).toEqual({ winnerId: 'a', reason: 'POINTS' });
  expect(state.players.map((p) => p.score)).toEqual([8, 1]);
  expect(events.filter((e) => e.type === 'combat-damage')).toHaveLength(2);
  expect(events.filter((e) => e.type === 'combat-restarted')).toHaveLength(1);
  expect(events.some((e) => e.type === 'gear-played')).toBe(true);
  expect(events.some((e) => e.type === 'spell-resolved')).toBe(true);
  // Rejouer les seules intentions sur le même état initial produit exactement le même résultat.
  let replay = rolled.state;
  for (const action of transcript) {
    const r = act(replay, action);
    if (!r.ok) throw new Error(r.reason);
    replay = r.state;
  }
  expect(replay).toEqual(state);
  expect(getLegalActions(state, 'a')).toEqual([]);
});
