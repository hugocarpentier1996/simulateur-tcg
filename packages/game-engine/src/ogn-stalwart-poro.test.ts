import { expect, it } from 'vitest';
import * as catalogue from '../../game-data/src/index.js';
import { act, effectiveMight, type GameState } from './index.js';
it('Stalwart Poro : coût et caractéristiques imprimées, raccordement au moteur', () => {
  const definition = catalogue.stalwartPoro;
  const state: GameState = {
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    activePlayerId: 'a',
    phase: 'main',
    showdown: null,
    zones: [
      { id: 'hand', kind: 'hand', ownerId: 'a' },
      { id: 'base', kind: 'base', ownerId: 'a' },
      { id: 'f', kind: 'battlefield' },
    ],
    cards: [
      { id: 'card', definitionId: 'ogn-052-298', ownerId: 'a', zoneId: 'hand' },
    ],
    units: [],
    resources: { a: { energy: 2, power: {} } },
    battlefields: [{ zoneId: 'f', controllerId: null }],
    scoredBattlefields: {},
    unitDefinitions: definition ? [definition] : [],
  };
  const r = act(state, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'card',
    payment: { energyRunes: [], powerRunes: [] },
  });
  expect(r.ok).toBe(true);
  if (!r.ok) throw new Error(r.reason);
  expect(definition.cost).toEqual({ energy: 2, power: {} });
  expect(r.state.units[0]).toMatchObject({
    might: 2,
    ready: false,
    zoneId: 'base',
  });
  expect(r.state.resources.a!.energy).toBe(0);
  r.state.units[0]!.zoneId = 'f';
  r.state.showdown = {
    kind: 'combat',
    battlefieldId: 'f',
    initiatorId: 'b',
    defenderId: 'a',
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
    stage: 'priority',
    assignments: {},
  };
  expect(effectiveMight(r.state.units[0]!, r.state)).toBe(3);
});
