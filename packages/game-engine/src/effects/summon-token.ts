import type { ActionResult, GameState } from '../types.js';
import { canSummonAt } from '../actions/unit-destination.js';

/** Catalogue + propriétaire + destination -> un jeton Tap sans paiement, ID déterministe.
 * Destination devenue illégale : aucune invocation. Définition absente : erreur de configuration. */
export function summonToken(
  state: GameState,
  ownerId: string,
  destinationId: string,
  definitionId: string,
): Extract<ActionResult, { ok: true }> {
  const events: Extract<ActionResult, { ok: true }>['events'] = [];
  if (!canSummonAt(state, ownerId, destinationId))
    return { ok: true, state, events };
  const definition = state.unitDefinitions?.find((d) => d.id === definitionId);
  if (!definition) throw new Error('Définition du jeton absente du catalogue.');
  let next = state.nextTokenId ?? 1;
  const ids = new Set(
    [...state.cards, ...state.units, ...(state.gears ?? [])].map((c) => c.id),
  );
  while (ids.has(`token:${next}`)) next++;
  const id = `token:${next}`;
  return {
    ok: true,
    state: {
      ...state,
      nextTokenId: next + 1,
      units: [
        ...state.units,
        {
          id,
          definitionId: definition.id,
          ownerId: ownerId,
          zoneId: destinationId,
          might: definition.might,
          damage: 0,
          ready: false,
          token: true,
        },
      ],
    },
    events: [
      ...events,
      {
        type: 'token-summoned',
        unitId: id,
        playerId: ownerId,
        zoneId: destinationId,
      },
    ],
  };
}
