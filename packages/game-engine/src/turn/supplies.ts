import type { ActionResult, GameEvent, GameState, ZoneKind } from '../types.js';

/** État en Channel -> deux runes Ready, trois au premier tour du second joueur.
 * Le bonus est consommé même si la pile est insuffisante ou vide. */
export function channelRunes(
  state: GameState,
): Extract<ActionResult, { ok: true }> {
  const bonus = state.initialChannelBonusPlayerId === state.activePlayerId;
  const result = takeFromPile(state, 'rune-pile', 'runes', bonus ? 3 : 2);
  return bonus
    ? {
        ...result,
        state: { ...result.state, initialChannelBonusPlayerId: null },
      }
    : result;
}

export { drawCard } from './draw.js';

/** Piles du joueur actif -> transfert des instances disponibles, sans duplication.
 * Pile de runes absente/vide : aucune pénalité.
 * Une destination absente alors que la source contient des cartes est un état invalide. */
function takeFromPile(
  state: GameState,
  source: ZoneKind,
  target: ZoneKind,
  count: number,
  playerId = state.activePlayerId,
  ready = true,
): Extract<ActionResult, { ok: true }> {
  const from = state.zones.find(
    (zone) => zone.ownerId === playerId && zone.kind === source,
  );
  const to = state.zones.find(
    (zone) => zone.ownerId === playerId && zone.kind === target,
  );
  const selected = from
    ? state.cards.filter((card) => card.zoneId === from.id).slice(0, count)
    : [];
  if (selected.length && !to)
    throw new Error(`Zone ${target} absente pour ${playerId}.`);
  const ids = new Set(selected.map((card) => card.id));
  const events: GameEvent[] = [];
  if (source === 'rune-pile')
    events.push({ type: 'runes-channeled', playerId, cardIds: [...ids] });
  else
    for (const card of selected)
      events.push({ type: 'card-drawn', playerId, cardId: card.id });
  return {
    ok: true,
    state: {
      ...state,
      cards: state.cards.map((card) =>
        ids.has(card.id) && to
          ? {
              ...card,
              zoneId: to.id,
              ...(source === 'rune-pile' ? { ready } : {}),
            }
          : card,
      ),
    },
    events,
  };
}

/** Channel explicite par effet : propriétaire, quantité et Ready/Tap ; pile vide sans pénalité. */
export function channelForPlayer(
  state: GameState,
  playerId: string,
  count: number,
  ready = false,
) {
  if (!Number.isInteger(count) || count < 0)
    throw new RangeError('Quantité de runes invalide.');
  return takeFromPile(state, 'rune-pile', 'runes', count, playerId, ready);
}
