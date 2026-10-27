import { expect, it } from 'vitest';
import { finalSpark } from '../../game-data/src/index.js';
import { act, type GameAction, type GameState } from './index.js';

function fixture(zoneId: string, might: number): GameState {
  const card = finalSpark;
  return {
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    spellDefinitions: [card],
    zones: [
      { id: 'field', kind: 'battlefield' },
      ...['a', 'b'].flatMap((ownerId) =>
        (['base', 'graveyard', 'hand'] as const).map((kind) => ({
          id: `${kind}-${ownerId}`,
          kind,
          ownerId,
        })),
      ),
    ],
    units: [
      {
        id: 'target',
        definitionId: 'fixture',
        ownerId: 'b',
        zoneId,
        ready: false,
        damage: 0,
        might,
      },
    ],
    cards: [
      { id: 'spark', definitionId: card.id, ownerId: 'a', zoneId: 'hand-a' },
    ],
    resources: { a: { energy: 8, power: {} } },
    battlefields: [{ zoneId: 'field', controllerId: 'b' }],
    scoredBattlefields: {},
    showdown: null,
  };
}
const cast: GameAction = {
  type: 'cast-spell',
  playerId: 'a',
  cardId: 'spark',
  targetId: 'target',
  payment: { energyRunes: [], powerRunes: [] },
};
function step(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}

it.each(['base-b', 'field'])(
  'Final Spark coûte 8 énergie, sans Power, et tue une cible de 8 Might en %s',
  (zoneId) => {
    let s = fixture(zoneId, 8);
    s = step(s, cast);
    expect(s.resources.a).toEqual({ energy: 0, power: {} });
    expect(s.units[0]?.damage).toBe(0);
    s = step(s, { type: 'pass', playerId: 'a' });
    s = step(s, { type: 'pass', playerId: 'b' });
    expect(s.units).toEqual([]);
    expect(s.cards.find((c) => c.id === 'target')?.zoneId).toBe('graveyard-b');
  },
);

it('refuse 7 énergie et conserve 8 dégâts sur une unité de 9 Might', () => {
  let s = fixture('field', 9);
  s.resources.a!.energy = 7;
  expect(act(s, cast)).toEqual({ ok: false, reason: 'INSUFFICIENT_RESOURCES' });
  s.resources.a!.energy = 8;
  s = step(s, cast);
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, { type: 'pass', playerId: 'b' });
  expect(s.units[0]).toMatchObject({ might: 9, damage: 8 });
});
