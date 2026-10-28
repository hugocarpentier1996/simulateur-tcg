import { expect, it } from 'vitest';
import * as catalogue from '../../game-data/src/index.js';
import { act, type GameState } from './index.js';
it('Mega-Mech : coût et caractéristiques imprimées, raccordement au moteur', () => {
  const definition = catalogue.megaMech;
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
      { id: 'card', definitionId: 'ogn-088-298', ownerId: 'a', zoneId: 'hand' },
    ],
    units: [],
    resources: { a: { energy: 7, power: {} } },
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
  expect(definition.cost).toEqual({ energy: 7, power: {} });
  expect(r.state.units[0]).toMatchObject({
    might: 8,
    ready: false,
    zoneId: 'base',
  });
  expect(r.state.resources.a!.energy).toBe(0);
});
