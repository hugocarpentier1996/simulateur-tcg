import type { GameEvent, GameState } from '../types.js';
import type { SpellBlueprint } from '../spell-types.js';
import type { ModeChoiceEntry } from './mode-choice.js';
import {
  spellTarget,
  stackSpellTarget,
  validBattlefieldTarget,
} from './target.js';

/** Effets exigeant des choix en plus de la cible principale (sélections, seconde cible,
 * destination) : non proposés pour un lancement gratuit par effet (limite documentée). */
const NEEDS_EXTRA = new Set([
  'boost-selected-allies',
  'move-up-to-two-allies-to-base',
  'kill-selected-total-might',
  'damage-instances',
  'damage-selected-units',
  'duel',
  'strike',
  'fight-at-destination',
  'move-ally-to-target',
  'move-to-battlefield',
  'move-unit',
  'might-damage-enemies-then-move',
  'stun-with-enemy-here',
  'discard-for-damage',
  'summon-recruits',
]);

/** Cibles principales d'un sort lancé gratuitement par un effet (Blind Fury, Kai'Sa, Ava,
 * Promising Future), choisies à sa mise sur la pile. null : sort non lançable par ce biais. */
export function freeCastTargets(
  state: GameState,
  definition: SpellBlueprint,
  casterId: string,
): string[] | null {
  if (definition.effects.some((e) => NEEDS_EXTRA.has(e.type))) return null;
  const kind = definition.target.kind;
  if (kind === 'caster') return [casterId];
  if (kind === 'unit')
    return state.units
      .filter((u) => spellTarget(state, definition, u.id, casterId))
      .map((u) => u.id);
  if (kind === 'battlefield')
    return state.battlefields
      .map((f) => f.zoneId)
      .filter((id) => validBattlefieldTarget(state, id));
  if (kind === 'stack-spell')
    return (state.stack?.entries ?? []).flatMap((e) =>
      'card' in e && stackSpellTarget(state, definition, e.card.id)
        ? [e.card.id]
        : [],
    );
  return null;
}

/** Entrée de pile : à sa résolution, le sort indiqué est lancé (cible choisie à ce moment
 * s'il en faut une). */
export function freeCastEntry(
  cardId: string,
  casterId: string,
  recycleOnResolve = false,
): ModeChoiceEntry {
  return {
    kind: 'mode-choice',
    sourceId: cardId,
    ownerId: casterId,
    modes: [],
    freeCast: { cardId, ...(recycleOnResolve ? { recycleOnResolve } : {}) },
  };
}

/** Sort lancé : retiré de sa zone et posé sur la pile pour le lanceur, sur la cible donnée. */
export function castFree(
  state: GameState,
  cardId: string,
  casterId: string,
  targetId: string,
  recycleOnResolve = false,
): { state: GameState; events: GameEvent[] } {
  const card = state.cards.find((c) => c.id === cardId);
  const definition = state.spellDefinitions?.find(
    (d) => d.id === card?.definitionId,
  );
  if (!card || !definition) return { state, events: [] };
  const entry = {
    card,
    definition,
    casterId,
    targetId,
    ...(recycleOnResolve ? { recycleOnResolve: true } : {}),
  };
  return {
    state: {
      ...state,
      cards: state.cards.filter((c) => c.id !== cardId),
      stack: {
        entries: [...(state.stack?.entries ?? []), entry],
        initiatorId: state.stack?.initiatorId ?? casterId,
        priorityPlayerId: state.stack?.priorityPlayerId ?? state.activePlayerId,
        consecutivePasses: 0,
      },
    },
    events: [],
  };
}
