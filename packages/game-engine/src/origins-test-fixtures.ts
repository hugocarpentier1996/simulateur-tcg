import { act } from './act.js';
import type { GameState, GameAction } from './types.js';
import type { SpellBlueprint } from './spell-types.js';
/** Petite table commune aux tests de cartes Origins ; les zones adverses existent aussi. */
export function spellScenario(definition: SpellBlueprint): GameState {
  return {
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    activePlayerId: 'a',
    phase: 'main',
    showdown: null,
    zones: [
      { id: 'f', kind: 'battlefield' },
      { id: 'g', kind: 'battlefield' },
      ...['a', 'b'].flatMap((ownerId) =>
        (
          ['base', 'hand', 'graveyard', 'deck', 'runes', 'rune-pile'] as const
        ).map((kind) => ({ id: `${kind}-${ownerId}`, kind, ownerId })),
      ),
    ],
    cards: [
      {
        id: 'spell',
        definitionId: definition.id,
        ownerId: 'a',
        zoneId: 'hand-a',
      },
      ...['a', 'b'].flatMap((ownerId) =>
        [0, 1, 2].map((i) => ({
          id: `draw-${ownerId}-${i}`,
          definitionId: 'test',
          ownerId,
          zoneId: `deck-${ownerId}`,
        })),
      ),
    ],
    units: [
      {
        id: 'ally',
        definitionId: 'test',
        ownerId: 'a',
        zoneId: 'f',
        ready: true,
        might: 3,
        damage: 0,
      },
      {
        id: 'enemy',
        definitionId: 'test',
        ownerId: 'b',
        zoneId: 'g',
        ready: true,
        might: 3,
        damage: 0,
      },
    ],
    resources: {
      a: { energy: 10, power: { orange: 2 } },
      b: { energy: 10, power: {} },
    },
    battlefields: [
      { zoneId: 'f', controllerId: 'a' },
      { zoneId: 'g', controllerId: 'b' },
    ],
    scoredBattlefields: {},
    spellDefinitions: [definition],
  };
}
export const noRunes = { energyRunes: [], powerRunes: [] };
export function step(state: GameState, action: GameAction) {
  const r = act(state, action);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}
export function resolveTop(state: GameState) {
  state = step(state, {
    type: 'pass',
    playerId: state.stack!.priorityPlayerId,
  });
  return step(state, { type: 'pass', playerId: state.stack!.priorityPlayerId });
}
