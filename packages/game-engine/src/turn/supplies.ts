import type { ActionResult, GameEvent, GameState, ZoneKind } from '../types.js';

/** État en Channel -> jusqu'à deux runes du sommet placées Ready dans la zone runes. */
export function channelRunes(
  state: GameState,
): Extract<ActionResult, { ok: true }> {
  return takeFromPile(state, 'rune-pile', 'runes', 2);
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
): Extract<ActionResult, { ok: true }> {
  const playerId = state.activePlayerId;
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
              ...(source === 'rune-pile' ? { ready: true } : {}),
            }
          : card,
      ),
    },
    events,
  };
}
