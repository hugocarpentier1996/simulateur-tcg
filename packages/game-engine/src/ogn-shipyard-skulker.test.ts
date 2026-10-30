import { expect, it } from 'vitest';
import * as catalogue from '../../game-data/src/index.js';
import { act, type GameState } from './index.js';
it('Shipyard Skulker : unité sans capacité, 3 énergie pour 3 Might, arrivée Tap en base', () => {
  const definition = catalogue.shipyardSkulker;
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
      { id: 'card', definitionId: 'ogn-175-298', ownerId: 'a', zoneId: 'hand' },
    ],
    units: [],
    resources: { a: { energy: 3, power: {} } },
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
  if (!r.ok) throw new Error(r.reason);
  expect(r.state.units[0]).toMatchObject({
    might: 3,
    ready: false,
    zoneId: 'base',
  });
  expect(r.state.resources.a!.energy).toBe(0);
  expect(r.state.stack ?? null).toBeNull();
});
