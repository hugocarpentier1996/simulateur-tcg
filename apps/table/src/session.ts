import {
  act,
  getLegalActions,
  createGame,
  recordOpeningRoll,
  type GameState,
  type GameAction,
  type GameEvent,
  type ActionResult,
} from '../../../packages/game-engine/src/index.js';
import {
  testUnits,
  defineUnit,
} from '../../../packages/game-data/src/index.js';

/** Adaptation locale des couleurs provisoires du catalogue, sans modifier ses cartes de test. */
export const demoUnits = testUnits.map((unit) =>
  defineUnit({
    ...unit,
    cost: {
      energy: unit.cost.energy,
      power: Object.fromEntries(
        Object.entries(unit.cost.power).map(([color, amount]) => [
          color === 'color-1' ? 'rouge' : 'bleu',
          amount,
        ]),
      ),
    },
  }),
);

export interface Session {
  state: GameState;
  log: string[];
  error: string | null;
}

export const playerName = (id: string) =>
  id === 'a' ? 'Joueur 1' : id === 'b' ? 'Joueur 2' : id;
export const cardName = (id: string) =>
  demoUnits.find((d) => d.id === id)?.name ?? id;

function requireState(result: ActionResult): GameState {
  if (!result.ok) throw new Error(`Préparation de la démo : ${result.reason}`);
  return result.state;
}

/** Sans entrée -> partie locale reproductible en première Main.
 * Decks fixes de 39 cartes, 12 runes, dés 19/8 et aucun mulligan.
 * Utilise exclusivement les API du moteur ; aucune sauvegarde ni hasard navigateur. */
export function createDemo(): Session {
  let state = requireState(
    createGame({
      randomState: 73,
      unitDefinitions: demoUnits,
      players: ['a', 'b'].map((id) => ({
        id,
        deck: Array.from({ length: 39 }, (_, i) => ({
          id: `${id}-card-${i}`,
          definitionId: demoUnits[i % demoUnits.length]!.id,
        })),
        runes: Array.from({ length: 12 }, (_, i) => ({
          id: `${id}-rune-${i}`,
          definitionId: 'rune',
          color: i % 2 === 0 ? 'rouge' : 'bleu',
        })),
        legend: {
          id: `${id}-legend`,
          definitionId: 'legend',
          colors: ['rouge', 'bleu'],
        },
        champion: { id: `${id}-chosen`, definitionId: 'test-guard' },
        battlefields: [0, 1, 2].map((i) => ({
          id: `${id}-field-${i}`,
          definitionId: `field-${i}`,
        })),
      })),
    }),
  );
  state = requireState(recordOpeningRoll(state, { a: 19, b: 8 }));
  state = requireState(
    act(state, {
      type: 'choose-first-player',
      playerId: 'a',
      firstPlayerId: 'a',
    }),
  );
  for (const playerId of ['a', 'b'])
    state = requireState(
      act(state, { type: 'mulligan', playerId, cardIds: [] }),
    );
  return {
    state,
    log: [
      'Partie de test préparée : dés 19 / 8, aucune carte remplacée.',
      'Joueur 1 commence : 2 runes et 5 cartes en main.',
    ],
    error: null,
  };
}

const refusals: Record<string, string> = {
  INSUFFICIENT_RESOURCES:
    'Le paiement choisi ne couvre pas le coût de la carte.',
  INVALID_SUMMON_DESTINATION:
    'Choisis ta base ou un battlefield que tu contrôles.',
  RUNE_NOT_READY:
    'Une rune Tap ne peut pas produire d’énergie. Elle peut fournir du Power.',
  PLAY_WINDOW_CLOSED: 'Cette unité ne peut pas être jouée à cet instant.',
  GAME_OVER: 'La partie est terminée.',
};

function describe(event: GameEvent): string | null {
  switch (event.type) {
    case 'unit-played':
      return `${playerName(event.playerId)} joue ${cardName(event.definitionId)} — arrivée Tap.`;
    case 'cost-paid':
      return `Paiement : ${event.energy} énergie, ${
        Object.entries(event.power)
          .map(([c, n]) => `${n} Power ${c}`)
          .join(', ') || 'aucun Power'
      }.`;
    case 'turn-ended':
      return `${playerName(event.playerId)} termine son tour.`;
    case 'turn-started':
      return `Début du tour de ${playerName(event.playerId)}.`;
    case 'cards-readied':
      return `${event.cardIds.length} carte(s) redressée(s).`;
    case 'runes-channeled':
      return `${playerName(event.playerId)} reçoit ${event.cardIds.length} rune(s).`;
    case 'card-drawn':
      return `${playerName(event.playerId)} pioche une carte.`;
    case 'phase-started':
      return event.phase === 'main'
        ? 'Main : cartes et actions disponibles.'
        : null;
    case 'game-ended':
      return `${playerName(event.winnerId)} remporte la partie.`;
    case 'deck-recycled':
      return `${playerName(event.playerId)} recycle son cimetière.`;
    case 'deck-penalty':
      return `${playerName(event.playerId)} gagne ${event.amount} point(s) par épuisement du deck adverse.`;
    default:
      return null;
  }
}

/** Session + intention -> nouvelle session ; seul act décide de la légalité.
 * En cas de refus, état et journal conservés, message français (code en repli).
 * Le journal garde les 200 dernières lignes ; recharger la page réinitialise tout. */
export function dispatch(session: Session, action: GameAction): Session {
  const result = act(session.state, action);
  if (!result.ok)
    return {
      ...session,
      error: refusals[result.reason] ?? `Action refusée : ${result.reason}`,
    };
  return {
    state: result.state,
    error: null,
    log: [
      ...session.log,
      ...result.events
        .map(describe)
        .filter((line): line is string => line !== null),
    ].slice(-200),
  };
}

/** État actuel + carte -> placements autorisés avec un paiement déterministe du moteur.
 * Une carte hors de la main/zone champion active, impayable ou hors fenêtre donne [].
 * Un seul plan par destination ; ce prototype ne demande pas de stratégie de paiement. */
export function placementOptions(state: GameState, cardId: string) {
  return getLegalActions(state, state.activePlayerId).filter(
    (action): action is Extract<GameAction, { type: 'play-unit' }> =>
      action.type === 'play-unit' && action.cardId === cardId,
  );
}

/** Dépôt carte/zone -> paiement et mise en jeu atomiques, ou refus sans modifier la partie.
 * Recalcule les actions au dépôt pour ne jamais utiliser une prévisualisation périmée. */
export function placeUnit(
  session: Session,
  cardId: string,
  destinationId: string,
): Session {
  const action = placementOptions(session.state, cardId).find(
    (a) => a.destinationId === destinationId,
  );
  if (!action)
    return {
      ...session,
      error:
        'Placement impossible : destination non autorisée ou ressources insuffisantes.',
    };
  return dispatch(session, action);
}
