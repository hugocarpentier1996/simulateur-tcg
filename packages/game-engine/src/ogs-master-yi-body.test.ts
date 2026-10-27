import { expect, it } from 'vitest';
import { masterYiBody } from '../../game-data/src/ogs/master-yi-body.js';
import {
  act,
  getLegalActions,
  type GameState,
  type GameAction,
} from './index.js';

function scenario(): GameState {
  return {
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 2 },
      { id: 'b', score: 0 },
    ],
    unitDefinitions: [
      masterYiBody,
      {
        id: 'ordinary',
        type: 'unit',
        might: 1,
        cost: { energy: 1, power: {} },
      },
    ],
    zones: [
      { id: 'hand', kind: 'hand', ownerId: 'a' },
      { id: 'base-a', kind: 'base', ownerId: 'a' },
      { id: 'base-b', kind: 'base', ownerId: 'b' },
      ...['origin', 'destination'].map((id) => ({
        id,
        kind: 'battlefield' as const,
      })),
    ],
    cards: [],
    units: [
      {
        id: 'yi',
        definitionId: masterYiBody.id,
        ownerId: 'a',
        zoneId: 'origin',
        ready: true,
        might: 6,
        damage: 0,
      },
    ],
    resources: { a: { energy: 7, power: { orange: 1 } } },
    scoredBattlefields: { a: ['origin', 'destination'] },
    battlefields: [
      { zoneId: 'origin', controllerId: 'a' },
      { zoneId: 'destination', controllerId: null },
    ],
    showdown: null,
  };
}
const move = {
  type: 'move',
  playerId: 'a',
  unitId: 'yi',
  destinationId: 'destination',
} as const;
function step(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}

it('Ganking rejoint un autre champ, devient Tap, libère le champ quitté et ne rescore pas', () => {
  const input = scenario();
  const before = structuredClone(input);
  expect(getLegalActions(input, 'a')).toContainEqual(move);
  let s = step(input, move);
  expect(input).toEqual(before);
  expect(s.units[0]).toMatchObject({ zoneId: 'destination', ready: false });
  expect(s.battlefields[0]!.controllerId).toBeNull();
  expect(s.showdown?.kind).toBe('open');
  expect(s.scoredBattlefields).toEqual(before.scoredBattlefields);
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, { type: 'pass', playerId: 'b' });
  expect(s.battlefields[1]!.controllerId).toBe('a');
  expect(s.players[0]!.score).toBe(2);
});

it('conserve le contrôle du champ quitté si un allié reste et ouvre un combat sur le champ adverse', () => {
  const s = scenario();
  s.units.push(
    { ...s.units[0]!, id: 'ally', definitionId: 'ordinary' },
    {
      ...s.units[0]!,
      id: 'enemy',
      definitionId: 'ordinary',
      ownerId: 'b',
      zoneId: 'destination',
    },
  );
  s.battlefields[1]!.controllerId = 'b';
  const moved = step(s, move);
  expect(moved.battlefields.map((b) => b.controllerId)).toEqual(['a', 'b']);
  expect(moved.showdown).toMatchObject({
    kind: 'combat',
    initiatorId: 'a',
    defenderId: 'b',
  });
});

it('ne contourne pas Ready, la propriété Ganking, le tour ni la destination', () => {
  for (const modify of [
    (s: GameState) => {
      s.units[0]!.ready = false;
    },
    (s: GameState) => {
      s.units[0]!.definitionId = 'ordinary';
    },
    (s: GameState) => {
      s.activePlayerId = 'b';
    },
  ]) {
    const s = scenario();
    modify(s);
    const before = structuredClone(s);
    expect(act(s, move).ok).toBe(false);
    expect(s).toEqual(before);
  }
  for (const destinationId of ['origin', 'base-a', 'base-b'])
    expect(act(scenario(), { ...move, destinationId }).ok).toBe(false);
});

it('se joue Ready pour 7 énergie et 1 orange puis peut rejoindre un champ immédiatement', () => {
  const s = scenario();
  s.units = [];
  s.battlefields[0]!.controllerId = null;
  s.cards.push({
    id: 'yi',
    definitionId: masterYiBody.id,
    ownerId: 'a',
    zoneId: 'hand',
  });
  let played = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'yi',
    payment: { energyRunes: [], powerRunes: [] },
  });
  expect(played.units[0]).toMatchObject({
    ready: true,
    might: 6,
    zoneId: 'base-a',
  });
  expect(played.resources.a).toEqual({ energy: 0, power: { orange: 0 } });
  played = step(played, move);
  expect(played.units[0]!.ready).toBe(false);
  expect(played.showdown?.kind).toBe('open');
});

it('Ganking peut renforcer un champ allié sans ouvrir de Showdown ni gagner de point', () => {
  const s = scenario();
  s.units.push({
    ...s.units[0]!,
    id: 'ally',
    definitionId: 'ordinary',
    zoneId: 'destination',
  });
  s.battlefields[1]!.controllerId = 'a';
  const moved = step(s, move);
  expect(moved.showdown).toBeNull();
  expect(moved.players).toEqual(s.players);
  expect(moved.units.find((u) => u.id === 'yi')).toMatchObject({
    zoneId: 'destination',
    ready: false,
  });
});
