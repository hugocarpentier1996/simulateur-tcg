import { boardOptions, dispatch, type Session } from './session.js';

export interface PlannedMove {
  unitId: string;
  destinationId: string;
}

/** Session et destination -> nouveau brouillon, sans mutation de la partie.
 * Refus : renvoie le même brouillon si le déplacement n'est pas légal.
 * Une unité déjà prévue remplace sa destination sans doubler son mouvement. */
export function planMove(
  session: Session,
  moves: readonly PlannedMove[],
  unitId: string,
  destinationId: string,
): readonly PlannedMove[] {
  if (
    !boardOptions(session.state, unitId).some(
      (a) => a.type === 'move' && a.destinationId === destinationId,
    )
  )
    return moves;
  return [
    ...moves.filter((m) => m.unitId !== unitId),
    { unitId, destinationId },
  ];
}

/** Brouillon -> action atomique revérifiée par le moteur, un seul niveau d'annulation.
 * Un plan périmé ou vide conserve état/historique et renseigne l'erreur de session. */
export function confirmMoves(
  session: Session,
  moves: readonly PlannedMove[],
): Session {
  return dispatch(session, {
    type: 'move-group',
    playerId: session.state.activePlayerId,
    moves,
  });
}
