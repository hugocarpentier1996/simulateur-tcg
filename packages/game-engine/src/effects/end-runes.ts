import type { GameState, GameAction, ActionResult } from '../types.js';
import type { ReadyRunesEntry } from '../legend-types.js';
import { activeLegends } from './legends.js';
/** Runes en jeu du joueur, Ready ou Tap ; exclut la pile. */
export function runeIdsInPlay(state: GameState, playerId: string): string[] {
  return state.cards
    .filter(
      (c) =>
        c.ownerId === playerId &&
        !!c.color &&
        state.zones.some(
          (z) =>
            z.id === c.zoneId && z.kind === 'runes' && z.ownerId === playerId,
        ),
    )
    .map((c) => c.id);
}
/** Unique légende par joueur dans la configuration normale. */
export function endRuneLegend(state: GameState, playerId: string) {
  return activeLegends(state, playerId).find(
    (l) => l.definition.readyRunesAtEnd !== undefined,
  );
}
/** Destinations choisies -> ne redresse que les runes encore en jeu du propriétaire.
 * Aucun remplacement de cible ni fin de tour ici ; act reprend lorsque tout est terminé. */
export function resolveReadyRunes(
  state: GameState,
  entry: ReadyRunesEntry,
): Extract<ActionResult, { ok: true }> {
  const valid = new Set(runeIdsInPlay(state, entry.ownerId));
  const ids = entry.runeIds.filter((id) => valid.has(id));
  return {
    ok: true,
    state: {
      ...state,
      cards: state.cards.map((c) =>
        ids.includes(c.id) ? { ...c, ready: true } : c,
      ),
    },
    events: [
      {
        type: 'cards-readied',
        playerId: entry.ownerId,
        cardIds: ids.filter(
          (id) => state.cards.find((c) => c.id === id)?.ready === false,
        ),
      },
      { type: 'legend-effect-resolved', sourceId: entry.sourceId },
    ],
  };
}
/** Choix de fin de tour : combinaisons sans doublons, taille min(2, runes présentes).
 * Les runes déjà Ready peuvent être choisies ; les choix sont validés ensuite par act. */
export function* endTurnChoices(
  state: GameState,
  playerId: string,
): Generator<GameAction> {
  const legend = endRuneLegend(state, playerId);
  if (!legend) {
    yield { type: 'end-turn', playerId };
    return;
  }
  const ids = runeIdsInPlay(state, playerId),
    count = Math.min(legend.definition.readyRunesAtEnd!, ids.length);
  for (const readyRuneIds of combinations(ids, count))
    yield { type: 'end-turn', playerId, readyRuneIds };
}
function* combinations(
  ids: readonly string[],
  count: number,
  start = 0,
  prefix: string[] = [],
): Generator<string[]> {
  if (!count) {
    yield prefix;
    return;
  }
  for (let i = start; i <= ids.length - count; i++)
    yield* combinations(ids, count - 1, i + 1, [...prefix, ids[i]!]);
}
