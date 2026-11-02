import { activeLegends } from './legends.js';
import { battlefieldDefinition } from './battlefield.js';
import type {
  ActionResult,
  CardInstance,
  GameAction,
  GameEvent,
  GameState,
  UnitBlueprint,
} from '../types.js';
import { payCost } from '../cost/payment.js';

/** Carte facedown jouable par ce joueur : posée lors d'un tour précédent (pas « fresh »),
 * sans Noxus Saboteur adverse sur son champ. Renvoie le champ où elle est cachée. */
export function playableFacedown(
  state: GameState,
  card: CardInstance | undefined,
  playerId: string,
): string | undefined {
  if (!card?.facedown || card.facedown.fresh || card.ownerId !== playerId)
    return undefined;
  const blocked = state.units.some(
    (u) =>
      u.zoneId === card.zoneId &&
      u.ownerId !== playerId &&
      state.unitDefinitions?.find((d) => d.id === u.definitionId)
        ?.blocksEnemyHidden,
  );
  return blocked ? undefined : card.zoneId;
}

/** Coût d'une carte jouée depuis facedown : ignoré (0), coûts supplémentaires à part. */
export function hiddenFree(
  card: CardInstance | undefined,
  cost: UnitBlueprint['cost'],
): UnitBlueprint['cost'] {
  return card?.facedown ? { energy: 0, power: {} } : cost;
}

/** Unités choisies par une carte jouée depuis facedown : toutes sur son champ. Les ids qui
 * ne désignent pas d'unité (joueur, zone) sont ignorés. */
export function choicesHere(
  state: GameState,
  ids: readonly (string | undefined)[],
  battlefieldId: string,
): boolean {
  return ids.every((id) => {
    const unit = state.units.find((u) => u.id === id);
    return !unit || unit.zoneId === battlefieldId;
  });
}

/** Définition d'une carte de la main portant Hidden (unité, sort ou gear). */
export function hasHidden(state: GameState, definitionId: string): boolean {
  return [
    ...(state.unitDefinitions ?? []),
    ...(state.spellDefinitions ?? []),
    ...(state.gearDefinitions ?? []),
  ].some((d) => d.id === definitionId && 'hidden' in d && d.hidden === true);
}

/** Cacher : son tour, Main en état ouvert ; carte Hidden en main ; champ qu'il contrôle où il
 * n'a pas encore de carte facedown (réponse 18) ; 1 Power de n'importe quel domaine. La carte devient facedown (fresh) sur le
 * champ, sans pile ni effet « when you play ». Refus atomique. */
export function hideCard(
  state: GameState,
  action: Extract<GameAction, { type: 'hide-card' }>,
): ActionResult {
  if (
    state.phase !== 'main' ||
    state.activePlayerId !== action.playerId ||
    state.stack ||
    state.showdown
  )
    return { ok: false, reason: 'HIDE_WINDOW_CLOSED' };
  const card = state.cards.find(
    (c) =>
      c.id === action.cardId &&
      c.ownerId === action.playerId &&
      state.zones.some(
        (z) =>
          z.id === c.zoneId &&
          z.kind === 'hand' &&
          z.ownerId === action.playerId,
      ),
  );
  if (!card || !hasHidden(state, card.definitionId))
    return { ok: false, reason: 'CARD_NOT_HIDDEN' };
  if (
    action.payWithEnergy &&
    !activeLegends(state, action.playerId).some(
      (l) => l.definition.hideWithEnergy,
    )
  )
    return { ok: false, reason: 'INVALID_ADDITIONAL_COST' };
  if (
    !state.battlefields.some(
      (f) =>
        f.zoneId === action.battlefieldId && f.controllerId === action.playerId,
    ) ||
    state.cards.filter(
      (c) =>
        c.facedown &&
        c.zoneId === action.battlefieldId &&
        c.ownerId === action.playerId,
    ).length >=
      1 +
        (battlefieldDefinition(state, action.battlefieldId)?.extraHiddenSlots ??
          0)
  )
    return { ok: false, reason: 'INVALID_HIDE_DESTINATION' };
  const paid = payCost(
    state,
    action.playerId,
    state.freeHidePlayers?.includes(action.playerId)
      ? { energy: 0, power: {} }
      : action.payWithEnergy
        ? { energy: 1, power: {} }
        : { energy: 0, power: {}, genericPower: 1 },
    action.payment,
  );
  if (!paid.ok) return paid;
  return {
    ok: true,
    state: {
      ...paid.state,
      cards: paid.state.cards.map((c) =>
        c.id === card.id
          ? { ...c, zoneId: action.battlefieldId, facedown: { fresh: true } }
          : c,
      ),
    },
    events: [
      {
        type: 'card-hidden',
        playerId: action.playerId,
        cardId: card.id,
        battlefieldId: action.battlefieldId,
      },
    ],
  };
}

/** Début de tour : les cartes cachées au tour précédent deviennent jouables. */
export function ripenFacedown(state: GameState): GameState {
  return state.cards.some((c) => c.facedown?.fresh)
    ? {
        ...state,
        cards: state.cards.map((c) =>
          c.facedown?.fresh ? { ...c, facedown: { fresh: false } } : c,
        ),
      }
    : state;
}

/** Nettoyage : carte facedown d'un champ que son propriétaire ne contrôle plus (hors champ
 * d'un Showdown en cours) -> révélée et mise au cimetière. */
export function trashLostFacedown(state: GameState): {
  state: GameState;
  events: GameEvent[];
} {
  const lost = state.cards.filter(
    (c) =>
      c.facedown &&
      c.zoneId !== state.showdown?.battlefieldId &&
      !state.battlefields.some(
        (f) => f.zoneId === c.zoneId && f.controllerId === c.ownerId,
      ),
  );
  if (!lost.length) return { state, events: [] };
  const grave = (ownerId: string) =>
    state.zones.find((z) => z.kind === 'graveyard' && z.ownerId === ownerId)
      ?.id;
  return {
    state: {
      ...state,
      cards: state.cards.map((c) => {
        if (!lost.includes(c)) return c;
        const rest = { ...c, zoneId: grave(c.ownerId) ?? c.zoneId };
        delete rest.facedown;
        return rest;
      }),
    },
    events: lost.map((c) => ({
      type: 'facedown-lost' as const,
      playerId: c.ownerId,
      cardId: c.id,
    })),
  };
}

/** Cartes Hidden du cimetière du joueur (Guerilla Warfare). */
export function hiddenInTrash(state: GameState, playerId: string): string[] {
  return state.cards
    .filter(
      (c) =>
        hasHidden(state, c.definitionId) &&
        state.zones.some(
          (z) =>
            z.id === c.zoneId &&
            z.kind === 'graveyard' &&
            z.ownerId === playerId,
        ),
    )
    .map((c) => c.id);
}
