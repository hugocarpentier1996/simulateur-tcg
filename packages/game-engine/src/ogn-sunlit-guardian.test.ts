import { expect, it } from 'vitest';
import * as catalogue from '../../game-data/src/index.js';
import { act, effectiveMight, type GameState } from './index.js';
it('Sunlit Guardian : 3 énergie, 3 Might, Tank à la mise en jeu et Shield en défense', () => {
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
      { id: 'card', definitionId: 'ogn-054-298', ownerId: 'a', zoneId: 'hand' },
    ],
    units: [],
    resources: { a: { energy: 3, power: {} } },
    battlefields: [{ zoneId: 'f', controllerId: null }],
    scoredBattlefields: {},
    unitDefinitions: [catalogue.sunlitGuardian],
  };
  const r = act(state, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'card',
    payment: { energyRunes: [], powerRunes: [] },
  });
  if (!r.ok) throw new Error(r.reason);
  expect(r.state.units[0]).toMatchObject({ might: 3, tank: true });
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
  expect(effectiveMight(r.state.units[0]!, r.state)).toBe(4);
});
