import type { GameState } from '../types.js';
/** Carte de son cimetière + type demandé -> cible encore récupérable, sinon undefined.
 * La présence dans le catalogue du type demandé est requise ; aucun permanent en jeu n'est ciblé. */
export function graveyardCard(
  state: GameState,
  ownerId: string,
  id: string,
  type: 'unit' | 'spell',
) {
  const definitions =
    type === 'unit' ? state.unitDefinitions : state.spellDefinitions;
  return state.cards.find(
    (c) =>
      c.id === id &&
      c.ownerId === ownerId &&
      state.zones.some(
        (z) =>
          z.id === c.zoneId && z.kind === 'graveyard' && z.ownerId === ownerId,
      ) &&
      definitions?.some((d) => d.id === c.definitionId),
  );
}
/** Carte toujours valide -> transfert en main sans mise en jeu ; cible disparue -> état inchangé. */
export function returnGraveyardCard(
  state: GameState,
  ownerId: string,
  id: string,
  type: 'unit' | 'spell',
): GameState {
  if (!graveyardCard(state, ownerId, id, type)) return state;
  const hand = state.zones.find(
    (z) => z.kind === 'hand' && z.ownerId === ownerId,
  );
  if (!hand) throw new Error('Main absente pour la récupération.');
  return {
    ...state,
    cards: state.cards.map((c) =>
      c.id === id ? { ...c, zoneId: hand.id } : c,
    ),
  };
}
