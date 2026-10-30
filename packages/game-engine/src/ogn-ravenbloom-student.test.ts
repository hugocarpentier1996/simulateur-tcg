import { expect, it } from 'vitest';
import * as catalogue from '../../game-data/src/index.js';
import {
  act,
  effectiveMight,
  type GameState,
  type GameAction,
} from './index.js';
function step(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}
it.each([0, 2])(
  'Ravenbloom Student déclenche +1 pour un sort coûtant %s énergie',
  (energy) => {
    const definition = catalogue.ravenbloomStudent;
    let s: GameState = {
      activePlayerId: 'a',
      phase: 'main',
      showdown: null,
      players: [
        { id: 'a', score: 0 },
        { id: 'b', score: 0 },
      ],
      zones: [
        { id: 'hand', kind: 'hand', ownerId: 'a' },
        { id: 'base', kind: 'base', ownerId: 'a' },
        { id: 'grave', kind: 'graveyard', ownerId: 'a' },
      ],
      cards: [
        {
          id: 'student',
          definitionId: 'ogn-103-298',
          ownerId: 'a',
          zoneId: 'hand',
        },
        {
          id: 'spell',
          definitionId: catalogue.flash.id,
          ownerId: 'a',
          zoneId: 'hand',
        },
      ],
      units: [],
      resources: { a: { energy: 4, power: {} } },
      battlefields: [],
      scoredBattlefields: {},
      unitDefinitions: definition ? [definition] : [],
      spellDefinitions: [{ ...catalogue.flash, cost: { energy, power: {} } }],
    };
    const payment = { energyRunes: [], powerRunes: [] };
    s = step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'student',
      payment,
    });
    expect(s.units[0]).toMatchObject({ might: 2, ready: false });
    expect(s.resources.a!.energy).toBe(2);
    s = step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      selectedUnitIds: [],
      payment,
    });
    expect(s.stack!.entries).toHaveLength(1);
    for (let i = 0; i < 2; i++)
      s = step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId });
    expect(s.stack!.entries).toHaveLength(1);
    expect(effectiveMight(s.units[0]!)).toBe(2);
    for (let i = 0; i < 2; i++)
      s = step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId });
    expect(effectiveMight(s.units[0]!)).toBe(3);
    expect(s.stack).toBeNull();
  },
);
