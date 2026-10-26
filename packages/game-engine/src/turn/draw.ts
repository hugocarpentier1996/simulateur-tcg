import type { ActionResult, CardInstance, GameState } from '../types.js';
import { shuffle } from '../random/shuffle.js';
import { applyDeckPenalty } from './deck-penalty.js';

/** État en Draw -> pioche, précédée si nécessaire du recyclage et de la pénalité.
 * Mélange injectable, alimenté par l'état du hasard conservé dans la partie.
 * Si la pénalité donne la victoire, arrêt immédiat. Les cartes défaussées doivent
 * être dans `cards`, pas dans `units` qui représente les unités en jeu. */
export function drawCard(
  state: GameState,
  mix: (
    cards: readonly CardInstance[],
    seed: number,
  ) => { items: CardInstance[]; seed: number } = shuffle,
): Extract<ActionResult, { ok: true }> {
  if (state.result) return { ok: true, state, events: [] };
  const playerId = state.activePlayerId;
  const deck = state.zones.find(
    (zone) => zone.ownerId === playerId && zone.kind === 'deck',
  );
  const top = deck && state.cards.find((card) => card.zoneId === deck.id);
  if (top) return drawTop(state, top);
  const grave = state.zones.find(
    (zone) => zone.ownerId === playerId && zone.kind === 'graveyard',
  );
  const discarded = grave
    ? state.cards.filter((card) => card.zoneId === grave.id)
    : [];
  if (!discarded.length) return applyDeckPenalty(state, true);
  if (!deck) throw new Error(`Zone deck absente pour ${playerId}.`);
  const mixed = mix(discarded, state.randomState ?? 1);
  const ids = new Set(discarded.map((card) => card.id));
  const recycled: GameState = {
    ...state,
    randomState: mixed.seed,
    cards: [
      ...state.cards.filter((card) => !ids.has(card.id)),
      ...mixed.items.map((card) => ({ ...card, zoneId: deck.id })),
    ],
  };
  const penalty = applyDeckPenalty(recycled, false);
  const drawn = penalty.state.result
    ? { state: penalty.state, events: [] }
    : drawTop(penalty.state, mixed.items[0]!);
  return {
    ok: true,
    state: drawn.state,
    events: [
      {
        type: 'deck-recycled',
        playerId,
        cardIds: mixed.items.map((card) => card.id),
      },
      ...penalty.events,
      ...drawn.events,
    ],
  };
}

/** Carte sélectionnée -> même instance transférée à la main et événement de pioche. */
function drawTop(
  state: GameState,
  card: CardInstance,
): Extract<ActionResult, { ok: true }> {
  const hand = state.zones.find(
    (zone) => zone.ownerId === state.activePlayerId && zone.kind === 'hand',
  );
  if (!hand) throw new Error(`Zone hand absente pour ${state.activePlayerId}.`);
  return {
    ok: true,
    state: {
      ...state,
      cards: state.cards.map((candidate) =>
        candidate.id === card.id
          ? { ...candidate, zoneId: hand.id }
          : candidate,
      ),
    },
    events: [
      { type: 'card-drawn', playerId: state.activePlayerId, cardId: card.id },
    ],
  };
}
