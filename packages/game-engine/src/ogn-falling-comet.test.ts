import { expect, it } from 'vitest';
import * as catalogue from '../../game-data/src/index.js';
import { act, type GameState } from './index.js';
it('Falling Comet paie 5 énergie et inflige 6 dégâts sur un battlefield, jamais en base', () => {
  const definition = catalogue.fallingComet;
  const s: GameState = {
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    activePlayerId: 'a',
    phase: 'main',
    showdown: null,
    zones: [
      { id: 'hand', kind: 'hand', ownerId: 'a' },
      { id: 'grave', kind: 'graveyard', ownerId: 'a' },
      { id: 'f', kind: 'battlefield' },
      { id: 'base', kind: 'base', ownerId: 'b' },
    ],
    cards: [
      {
        id: 'spell',
        definitionId: 'ogn-085-298',
        ownerId: 'a',
        zoneId: 'hand',
      },
    ],
    spellDefinitions: definition ? [definition] : [],
    units: [
      {
        id: 'target',
        definitionId: 'unit',
        ownerId: 'b',
        zoneId: 'f',
        ready: true,
        might: 8,
        damage: 0,
      },
    ],
    resources: { a: { energy: 5, power: {} } },
    battlefields: [{ zoneId: 'f', controllerId: 'b' }],
    scoredBattlefields: {},
  };
  const cast = {
    type: 'cast-spell' as const,
    playerId: 'a',
    cardId: 'spell',
    targetId: 'target',
    payment: { energyRunes: [], powerRunes: [] },
  };
  let r = act(s, cast);
  expect(r.ok).toBe(true);
  if (!r.ok) throw new Error(r.reason);
  expect(r.state.resources.a!.energy).toBe(0);
  expect(definition.timing).toBe('action');
  for (let i = 0; i < 2; i++) {
    r = act(r.state, {
      type: 'pass',
      playerId: r.state.stack!.priorityPlayerId,
    });
    if (!r.ok) throw new Error(r.reason);
  }
  expect(r.state.units[0]!.damage).toBe(6);
  s.units[0]!.zoneId = 'base';
  expect(act(s, cast)).toEqual({ ok: false, reason: 'INVALID_TARGET' });
});
