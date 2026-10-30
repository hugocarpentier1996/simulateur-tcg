import { cardInfo, illustratedUnits, demoBattlefields } from './catalogue.js';
import {
  mightOfDemacia,
  bodyRune,
  orderRune,
} from '../../../packages/game-data/src/index.js';
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
  /** Dix états précédant les actions réussies, sans historique imbriqué. */
  history: { state: GameState; log: string[] }[];
}

export const playerName = (id: string) =>
  id === 'a' ? 'Joueur 1' : id === 'b' ? 'Joueur 2' : id;
export const cardName = (id: string) =>
  cardInfo(id)?.displayName ?? cardInfo(id)?.name ?? id;

function requireState(result: ActionResult): GameState {
  if (!result.ok) throw new Error(`Préparation de la démo : ${result.reason}`);
  return result.state;
}

/** Sans entrée -> partie locale reproductible en première Main.
 * Decks fixes de 39 cartes, 12 runes, dés 19/8 et aucun mulligan.
 * illustrated active les cartes réelles et champs ; bo3 propose les choix de la première manche.
 * Utilise exclusivement les API du moteur ; aucune sauvegarde ni hasard navigateur. */
export function createDemo(
  illustrated = false,
  format: 'bo1' | 'bo3' = 'bo1',
): Session {
  const units = illustrated ? illustratedUnits : demoUnits;
  let state = requireState(
    createGame({
      randomState: 73,
      unitDefinitions: units,
      ...(illustrated
        ? {
            battlefieldDefinitions: demoBattlefields,
            legendDefinitions: [mightOfDemacia],
          }
        : {}),
      match:
        format === 'bo3' ? { format: 'bo3', gameNumber: 1 } : { format: 'bo1' },
      players: ['a', 'b'].map((id) => ({
        id,
        deck: Array.from({ length: 39 }, (_, i) => ({
          id: `${id}-card-${i}`,
          definitionId: units[i % units.length]!.id,
        })),
        runes: Array.from({ length: 12 }, (_, i) => ({
          id: `${id}-rune-${i}`,
          definitionId: illustrated
            ? i % 2 === 0
              ? bodyRune.id
              : orderRune.id
            : 'rune',
          color: illustrated
            ? i % 2 === 0
              ? 'orange'
              : 'jaune'
            : i % 2 === 0
              ? 'rouge'
              : 'bleu',
        })),
        legend: {
          id: `${id}-legend`,
          definitionId: illustrated ? mightOfDemacia.id : 'legend',
          colors: illustrated ? ['orange', 'jaune'] : ['rouge', 'bleu'],
        },
        champion: {
          id: `${id}-chosen`,
          definitionId: illustrated ? illustratedUnits[3]!.id : 'test-guard',
        },
        battlefields: [0, 1, 2].map((i) => ({
          id: `${id}-field-${i}`,
          definitionId: illustrated
            ? demoBattlefields[(i + (id === 'a' ? 0 : 1)) % 4]!.id
            : `field-${i}`,
        })),
      })),
    }),
  );
  if (state.setup?.stage === 'roll') state = prepareDemo(state);
  return {
    state,
    history: [],
    log: state.setup
      ? [
          'Chaque joueur choisit un champ parmi ses trois candidats avant les dés.',
        ]
      : [
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

/** Identifiant de carte ou d'unité -> nom affiché, cherché après puis avant l'action
 * (une unité détruite ou un sort résolu peut avoir quitté sa zone d'origine). */
function entityName(id: string, states: readonly GameState[]): string {
  for (const state of states) {
    const entity =
      state.units.find((u) => u.id === id) ??
      state.cards.find((c) => c.id === id);
    if (entity) return cardName(entity.definitionId);
  }
  return id;
}

/** Événement du moteur -> ligne de journal française, ou null si sans intérêt pour le joueur.
 * `states` sert uniquement à nommer les cartes ; aucune règle n'est recalculée ici. */
function describe(
  event: GameEvent,
  states: readonly GameState[],
): string | null {
  const name = (id: string) => entityName(id, states);
  switch (event.type) {
    case 'spell-cast':
      return `${playerName(event.playerId)} lance ${name(event.cardId)}.`;
    case 'spell-resolved':
      return `${name(event.cardId)} se résout.`;
    case 'spell-damage':
      return `${name(event.cardId)} inflige ${event.amount} dégât(s) à ${name(event.unitId)}.`;
    case 'ability-damage':
    case 'unit-damage':
      return `${name(event.sourceId)} inflige ${event.amount} dégât(s) à ${name(event.unitId)}.`;
    case 'unit-died':
      return `${name(event.unitId)} est détruite.`;
    case 'card-discarded':
      return `${playerName(event.playerId)} défausse ${name(event.cardId)}.`;
    case 'token-summoned':
      return `${playerName(event.playerId)} invoque ${name(event.unitId)}.`;
    case 'spell-returned':
      return `${playerName(event.playerId)} récupère ${name(event.cardId)} en main.`;
    case 'battlefield-effect-queued':
      return `${playerName(event.playerId)} prépare la capacité du champ.`;
    case 'battlefield-effect-resolved':
      return `Capacité du champ résolue pour ${playerName(event.playerId)}.`;
    case 'battlefield-selected':
      return `${playerName(event.playerId)} sélectionne son champ (${event.method === 'random' ? 'tirage BO1' : 'choix BO3'}).`;

    case 'unit-moved':
      return 'Une unité se déplace et devient Tap.';
    case 'showdown-opened':
      return 'Showdown ouvert : chaque joueur doit passer la priorité.';
    case 'priority-passed':
      return `${playerName(event.playerId)} passe la priorité.`;
    case 'battlefield-conquered':
      return `${playerName(event.playerId)} prend le contrôle du champ.`;
    case 'point-scored':
      return `${playerName(event.playerId)} gagne 1 point de ${event.source === 'HOLD' ? 'tenue (holding)' : 'conquête'}.`;
    case 'conquest-point-replaced':
      return `${playerName(event.playerId)} pioche à la place du dernier point de conquête.`;
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
    state:
      result.state.setup?.stage === 'roll'
        ? prepareDemo(result.state)
        : result.state,
    history: [
      ...session.history,
      { state: session.state, log: session.log },
    ].slice(-10),
    error: null,
    log: [
      ...session.log,
      ...result.events
        .map((event) => describe(event, [result.state, session.state]))
        .filter((line): line is string => line !== null),
    ].slice(-200),
  };
}

/** Session -> état et journal précédents, en retirant un niveau d'historique.
 * Restaure toute l'action (paiement, pioche et étapes automatiques inclus) et efface l'erreur.
 * Sans historique, retourne la session inchangée. Annulation locale, sans rétablissement. */
export function undo(session: Session): Session {
  const previous = session.history.at(-1);
  if (!previous) return session;
  return { ...previous, error: null, history: session.history.slice(0, -1) };
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

/** Carte ou unité -> placements/déplacements autorisés par le moteur.
 * Démo illustrée : attaques accessibles via le panneau de combat.
 * Les anciennes fixtures sans catalogue de champs gardent leur parcours sans combat. */
export function boardOptions(state: GameState, id: string) {
  if (!state.units.some((u) => u.id === id)) return placementOptions(state, id);
  return getLegalActions(state, state.activePlayerId).filter(
    (a): a is Extract<GameAction, { type: 'move' }> =>
      a.type === 'move' &&
      a.unitId === id &&
      (!!state.battlefieldDefinitions?.length ||
        !state.units.some(
          (u) =>
            u.zoneId === a.destinationId && u.ownerId !== state.activePlayerId,
        )),
  );
}

/** Dépôt d'une carte ou unité : recalcule les choix actuels et conserve état/historique si refus. */
export function playOrMove(
  session: Session,
  id: string,
  destinationId: string,
): Session {
  const action = boardOptions(session.state, id).find(
    (a) => a.destinationId === destinationId,
  );
  return action
    ? dispatch(session, action)
    : {
        ...session,
        error:
          'Destination indisponible : vérifie Ready, le tour, les ressources et l’absence d’unités adverses sur le champ.',
      };
}

/** Passe du joueur prioritaire dans l'Open Showdown ; le moteur clôture après les passes requises.
 * Sans Open Showdown, refuse sans créer d'historique. Aucun combat automatisé. */
export function passShowdown(session: Session): Session {
  const showdown = session.state.showdown;
  if (showdown?.kind !== 'open')
    return { ...session, error: 'Aucun Open Showdown en attente.' };
  return dispatch(session, {
    type: 'pass',
    playerId: showdown.priorityPlayerId,
  });
}

/** Dés et mulligans fixes de la démonstration, après sélection des champs. */
export function prepareDemo(state: GameState): GameState {
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
  return state;
}

/** Choix de progression et combat déjà validés par le moteur, pour les deux joueurs locaux.
 * Le clic doit recalculer cette liste ; aucun état de jeu n'est modifié pendant l'affichage. */
export function tableActions(session: Session): GameAction[] {
  return session.state.players
    .flatMap((p) => getLegalActions(session.state, p.id))
    .filter(
      (a) =>
        (a.type === 'end-turn' && a.readyRuneIds !== undefined) ||
        [
          'choose-vision',
          'choose-discard',
          'choose-attack-targets',
          'queue-death-effects',
          'choose-battlefield',
          'choose-defense-shield',
          'choose-hold-channel',
          'assign-damage',
          'pass',
        ].includes(a.type),
    );
}

/** Joueur dont les choix/main doivent être présentés ; les fenêtres obligatoires priment. */
export function handPlayer(state: GameState): string {
  return (
    state.pendingDiscard?.playerId ??
    state.pendingVision?.playerId ??
    state.pendingDeaths?.playerOrder[0] ??
    state.pendingAttackChoices?.[0]?.ownerId ??
    state.stack?.priorityPlayerId ??
    state.showdown?.priorityPlayerId ??
    state.priorityPlayerId ??
    state.activePlayerId
  );
}
/** Carte sélectionnée -> choix complets légaux (cibles, destinations et paiement inclus).
 * Ne choisit jamais automatiquement une cible. Une carte hors fenêtre donne []. */
export function cardActions(session: Session, cardId: string): GameAction[] {
  const instance =
    session.state.cards.find((c) => c.id === cardId) ??
    session.state.units.find((u) => u.id === cardId);
  if (!instance) return [];
  return getLegalActions(session.state, instance.ownerId).filter(
    (a) =>
      ((a.type === 'cast-spell' || a.type === 'play-unit') &&
        a.cardId === cardId) ||
      (a.type === 'activate-spell-energy' && a.unitId === cardId),
  );
}
/** Choix complet précédemment affiché -> revérification, paiement et empilement atomiques.
 * Si l'état a changé, refuse sans modifier partie/historique ; ne réinterprète pas l'index. */
export function submitCardAction(
  session: Session,
  cardId: string,
  action: GameAction,
): Session {
  const legal = cardActions(session, cardId).find(
    (a) => JSON.stringify(a) === JSON.stringify(action),
  );
  return legal
    ? dispatch(session, legal)
    : {
        ...session,
        error:
          'Ce choix n’est plus disponible. Sélectionne à nouveau la carte.',
      };
}
