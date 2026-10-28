import { expect, it } from 'vitest';
import * as catalogue from '../../game-data/src/index.js';
import { act, type GameState } from './index.js';
it('Mountain Drake : caractéristiques imprimées et mise en jeu', () => {
  const definition = catalogue.mountainDrake;
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
    ],
    cards: [
      { id: 'card', definitionId: 'ogn-142-298', ownerId: 'a', zoneId: 'hand' },
    ],
    units: [],
    resources: { a: { energy: 9, power: {} } },
    battlefields: [],
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
  expect(definition.cost).toEqual({ energy: 9, power: {} });
  expect(r.state.units[0]).toMatchObject({
    might: 10,
    ready: false,
    zoneId: 'base',
  });
  expect(r.state.resources.a!.energy).toBe(0);
});
