import type { GameAction, GameEvent, GameState } from '../types.js';
import type { ModeChoiceEntry } from './mode-choice.js';
import type { SpellEntry } from '../spell-types.js';
import { castSpell } from '../actions/cast-spell.js';
import { spellCastVariants } from '../legal/actions.js';
import { findPayment } from '../legal/payment.js';
import { spellChosenUnits, withDeflect } from '../cost/deflect.js';

type CastAction = Extract<GameAction, { type: 'cast-spell' }>;

/** Lancements gratuits possibles d'un sort par effet (Blind Fury, Kai'Sa, Ava, Promising
 * Future) : toutes les variantes complètes (cible, sélections, seconde cible, destination…)
 * acceptées par le moteur, choisies à la mise sur la pile. Seule la taxe Deflect est payée. */
export function freeCastOptions(
  state: GameState,
  cardId: string,
  casterId: string,
): CastAction[] {
  const card = state.cards.find((c) => c.id === cardId);
  const spell = state.spellDefinitions?.find(
    (d) => d.id === card?.definitionId,
  );
  if (!card || !spell) return [];
  const view: GameState = {
    ...state,
    freeCast: { cardId, playerId: casterId },
  };
  const options: CastAction[] = [];
  for (const variant of spellCastVariants(view, casterId, card, spell, {
    energyRunes: [],
    powerRunes: [],
  })) {
    const payment = findPayment(
      view,
      casterId,
      withDeflect(
        view,
        casterId,
        { energy: 0, power: {} },
        spellChosenUnits(spell, variant),
      ),
      'spell',
    );
    if (!payment) continue;
    const option = { ...variant, payment };
    if (castSpell(view, option).ok) options.push(option);
  }
  return options;
}

/** Entrée de pile : à sa résolution, le sort indiqué est lancé (variante choisie à ce moment
 * s'il y en a plusieurs). */
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

/** Variante choisie -> sort posé sur la pile comme un lancement normal, sans coût imprimé. */
export function castFreeOption(
  state: GameState,
  option: CastAction,
  recycleOnResolve = false,
): { state: GameState; events: GameEvent[] } {
  const view: GameState = {
    ...state,
    freeCast: { cardId: option.cardId, playerId: option.playerId },
  };
  const cast = castSpell(view, option);
  if (!cast.ok) return { state, events: [] };
  const next: GameState = { ...cast.state, freeCast: null };
  if (!recycleOnResolve || !next.stack)
    return { state: next, events: cast.events };
  return {
    state: {
      ...next,
      stack: {
        ...next.stack,
        entries: next.stack.entries.map((e) =>
          'card' in e && e.card.id === option.cardId
            ? { ...e, recycleOnResolve: true }
            : e,
        ),
      },
    },
    events: cast.events,
  };
}

/** Mystic Reversal : nouveaux choix complets (toutes les cibles, sélections, destination…)
 * pour le sort volé, au nom du voleur ; taxe Deflect due. Les choix identiques aux choix
 * actuels sont exclus (« skip » les garde). */
export function rechooseOptions(
  state: GameState,
  stolen: SpellEntry,
  casterId: string,
): CastAction[] {
  const view: GameState = { ...state, cards: [...state.cards, stolen.card] };
  const same = (o: CastAction) =>
    o.targetId === stolen.targetId &&
    (o.secondaryTargetId ?? null) === (stolen.secondaryTargetId ?? null) &&
    (o.destinationId ?? null) === (stolen.destinationId ?? null) &&
    (o.selectedUnitIds ?? []).join() ===
      (stolen.selectedUnitIds ?? []).join() &&
    (o.tokenDestinations ?? []).join() ===
      (stolen.tokenDestinations ?? []).join();
  return freeCastOptions(view, stolen.card.id, casterId).filter(
    (o) => !same(o),
  );
}

/** Nouveaux choix appliqués au sort volé : taxe payée, l'entrée garde sa place sur la pile. */
export function applyRechoice(
  state: GameState,
  stolenCardId: string,
  option: CastAction,
): { state: GameState; events: GameEvent[] } {
  const stack = state.stack;
  const old = stack?.entries.find(
    (e) => 'card' in e && e.card.id === stolenCardId,
  ) as SpellEntry | undefined;
  if (!stack || !old) return { state, events: [] };
  const view: GameState = { ...state, cards: [...state.cards, old.card] };
  const cast = castFreeOption(view, option);
  const entries = cast.state.stack?.entries ?? [];
  const fresh = entries.at(-1) as SpellEntry | undefined;
  if (!fresh || !('card' in fresh) || fresh.card.id !== stolenCardId)
    return { state, events: [] };
  return {
    state: {
      ...cast.state,
      stack: {
        ...cast.state.stack!,
        entries: entries.slice(0, -1).map((e) =>
          e === old || ('card' in e && e.card.id === stolenCardId)
            ? {
                ...fresh,
                ...(old.recycleOnResolve ? { recycleOnResolve: true } : {}),
              }
            : e,
        ),
      },
    },
    events: cast.events,
  };
}
