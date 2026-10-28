import { graveyardCard, returnGraveyardCard } from './graveyard-card.js';
import type { ActionResult, GameState } from '../types.js';

/** Choix figé à l'empilement ; absent uniquement si aucun sort n'était récupérable. */
export interface ReturnSpellEntry {
  kind: 'return-spell';
  sourceId: string;
  ownerId: string;
  targetId?: string;
}
/** État + propriétaire -> IDs des sorts de son cimetière, dans l'ordre des cartes. */
export function recoverableSpells(
  state: GameState,
  playerId: string,
): string[] {
  return state.cards
    .filter((c) => graveyardCard(state, playerId, c.id, 'spell'))
    .map((c) => c.id);
}
/** Effet -> carte choisie en main si encore légale. Source indépendante ; aucune pioche,
 * aucun remplacement de cible, aucun paiement. Une cible disparue ne fait rien. */
export function resolveReturnSpell(
  state: GameState,
  entry: ReturnSpellEntry,
): Extract<ActionResult, { ok: true }> {
  const hand = state.zones.find(
    (z) => z.ownerId === entry.ownerId && z.kind === 'hand',
  );
  const valid =
    hand &&
    entry.targetId &&
    recoverableSpells(state, entry.ownerId).includes(entry.targetId);
  return {
    ok: true,
    state: valid
      ? returnGraveyardCard(state, entry.ownerId, entry.targetId!, 'spell')
      : state,
    events: [
      { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
      ...(valid
        ? [
            {
              type: 'spell-returned' as const,
              playerId: entry.ownerId,
              cardId: entry.targetId!,
            },
          ]
        : []),
    ],
  };
}
