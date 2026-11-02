import { freeCastEntry, freeCastTargets } from './free-cast.js';
import { lookRecycleEvents } from './mode-choice.js';
import { findPayment } from '../legal/payment.js';
import { payCost } from '../cost/payment.js';
import type { GameEvent, GameState } from '../types.js';

/** Promising Future : joueurs restant à choisir et cartes déjà choisies. */
export interface FutureProgress {
  readonly casterId: string;
  readonly steps: readonly string[];
  readonly chosen: readonly { playerId: string; cardId: string }[];
}

function deckTop(state: GameState, playerId: string, count: number) {
  return state.cards
    .filter((c) =>
      state.zones.some(
        (z) => z.id === c.zoneId && z.kind === 'deck' && z.ownerId === playerId,
      ),
    )
    .slice(0, count);
}

/** Avance aux choix suivants (deck vide : joueur sauté) ; tous faits : les cartes sont jouées. */
export function futureStep(
  state: GameState,
  sourceId: string,
  progress: FutureProgress,
): { state: GameState; events: GameEvent[] } {
  const [playerId, ...steps] = progress.steps;
  if (playerId === undefined) return playFutureCards(state, progress);
  const looked = deckTop(state, playerId, 5);
  if (!looked.length)
    return futureStep(state, sourceId, { ...progress, steps });
  return {
    state: {
      ...state,
      pendingModeChoice: {
        kind: 'mode-choice',
        sourceId,
        ownerId: playerId,
        modes: looked.map((c) => `future:${c.id}` as const),
        future: { ...progress, steps },
      },
    },
    events: [],
  };
}

/** Carte choisie : les autres cartes regardées passent sous le deck, puis choix suivant. */
export function chooseFuture(
  state: GameState,
  sourceId: string,
  playerId: string,
  cardId: string,
  progress: FutureProgress,
): { state: GameState; events: GameEvent[] } {
  const rest = deckTop(state, playerId, 5)
    .map((c) => c.id)
    .filter((id) => id !== cardId);
  const next: GameState = {
    ...state,
    pendingModeChoice: null,
    cards: [
      ...state.cards.filter((c) => !rest.includes(c.id)),
      ...rest.map((id) => state.cards.find((c) => c.id === id)!),
    ],
  };
  const looked = deckTop(state, playerId, 5).map((c) => c.id);
  const stepped = futureStep(next, sourceId, {
    ...progress,
    chosen: [...progress.chosen, { playerId, cardId }],
  });
  return {
    state: stepped.state,
    events: [
      ...lookRecycleEvents(playerId, looked, rest.length),
      ...stepped.events,
    ],
  };
}

/** En commençant par le joueur après le lanceur, chaque carte est jouée en payant son seul
 * Power : unité ou gear en base, sort sans cible individuelle ajouté à la pile. Carte non
 * jouable (Power impayable, sort à cibles) : recyclée sous le deck (hypothèse). */
function playFutureCards(
  input: GameState,
  progress: FutureProgress,
): { state: GameState; events: GameEvent[] } {
  let state = input;
  const events: GameEvent[] = [];
  const ids = state.players.map((p) => p.id);
  const start = ids.indexOf(progress.casterId) + 1;
  const order = ids.map((_, i) => ids[(start + i) % ids.length]!);
  for (const playerId of order)
    for (const { cardId } of progress.chosen.filter(
      (c) => c.playerId === playerId,
    )) {
      const card = state.cards.find((c) => c.id === cardId);
      if (!card) continue;
      const unit = state.unitDefinitions?.find(
        (d) => d.id === card.definitionId,
      );
      const gear = state.gearDefinitions?.find(
        (d) => d.id === card.definitionId,
      );
      const spell = state.spellDefinitions?.find(
        (d) => d.id === card.definitionId,
      );
      const definition = unit ?? gear ?? spell;
      const base = state.zones.find(
        (z) => z.kind === 'base' && z.ownerId === playerId,
      );
      const playable =
        base &&
        definition &&
        (!spell ||
          (!!state.stack && freeCastTargets(state, spell, playerId) !== null));
      const cost = definition && { ...definition.cost, energy: 0 };
      const plan = playable && cost && findPayment(state, playerId, cost);
      const paid =
        plan &&
        cost &&
        payCost(state, playerId, cost, plan, spell ? 'spell' : 'ordinary');
      if (!base || !paid || !paid.ok) {
        state = {
          ...state,
          cards: [...state.cards.filter((c) => c.id !== cardId), card],
        };
        continue;
      }
      state = {
        ...paid.state,
        cards: paid.state.cards.filter((c) => c.id !== cardId),
      };
      if (unit) {
        state = {
          ...state,
          units: [
            ...state.units,
            {
              id: card.id,
              definitionId: card.definitionId,
              ownerId: playerId,
              zoneId: base.id,
              ready: unit.entersReady === true,
              might: unit.might,
              ...(unit.tank ? { tank: true } : {}),
              ...(unit.backline ? { backline: true } : {}),
              damage: 0,
            },
          ],
        };
        events.push({
          type: 'unit-played',
          playerId,
          unitId: card.id,
          definitionId: unit.id,
          zoneId: base.id,
        });
      } else if (gear) {
        state = {
          ...state,
          gears: [
            ...(state.gears ?? []),
            {
              id: card.id,
              definitionId: card.definitionId,
              ownerId: playerId,
              zoneId: base.id,
              ready: !gear.entersExhausted,
            },
          ],
        };
      } else if (spell && state.stack) {
        // Carte remise en jeu pour le lancement : cible choisie à sa mise sur la pile.
        state = {
          ...state,
          cards: [...state.cards, card],
          stack: {
            ...state.stack,
            entries: [...state.stack.entries, freeCastEntry(card.id, playerId)],
          },
        };
      }
    }
  return { state, events };
}
