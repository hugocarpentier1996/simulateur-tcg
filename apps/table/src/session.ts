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
import type { Selection } from './view.js';

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
/** Couleur de rune du moteur -> nom de domaine imprimé (Fury, Calm, Mind, Body, Chaos, Order). */
export const domainName = (color: string) =>
  ({
    rouge: 'Fury',
    vert: 'Calm',
    bleu: 'Mind',
    orange: 'Body',
    violet: 'Chaos',
    jaune: 'Order',
  })[color] ?? color;
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
  ABILITY_WINDOW_CLOSED:
    'Tu ne peux pas utiliser cette rune maintenant : attends ta priorité.',
  INVALID_RUNE: 'Cette rune ne t’appartient pas ou n’est pas en jeu.',
  GEAR_NOT_READY: 'Ce gear est déjà Tap.',
  INVALID_GEAR: 'Ce gear ne t’appartient pas.',
  INVALID_MULLIGAN: 'Choisis au plus 2 cartes de ta main à remplacer.',
};

/** Identifiant de carte ou d'unité -> nom affiché, cherché après puis avant l'action
 * (une unité détruite ou un sort résolu peut avoir quitté sa zone d'origine). */
function entityName(id: string, states: readonly GameState[]): string {
  for (const state of states) {
    const entity =
      state.units.find((u) => u.id === id) ??
      state.cards.find((c) => c.id === id) ??
      state.gears?.find((g) => g.id === id);
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
    case 'points-gained':
      return `${playerName(event.playerId)} gagne ${event.amount} point(s) grâce à ${name(event.sourceId)}.`;
    case 'gear-played':
      return `${playerName(event.playerId)} pose ${name(event.gearId)}.`;
    case 'spell-countered':
      return `${name(event.sourceId)} contre ${name(event.cardId)}.`;
    case 'gear-killed':
      return `${name(event.gearId)} est détruit.`;
    case 'gear-equipped':
      return `${playerName(event.playerId)} équipe ${name(event.gearId)} sur ${name(event.unitId)}.`;
    case 'gear-resource-added':
      return `${playerName(event.playerId)} utilise ${name(event.gearId)} : ${[
        event.energy ? `+${event.energy} énergie` : '',
        event.power ? `+1 Power ${domainName(event.power)}` : '',
      ]
        .filter(Boolean)
        .join(', ')}.`;
    case 'mulligan-completed':
      return event.cardIds.length
        ? `${playerName(event.playerId)} remplace ${event.cardIds.length} carte(s) sous son deck.`
        : `${playerName(event.playerId)} garde sa main.`;
    case 'rune-used':
      return event.power
        ? `${playerName(event.playerId)} recycle une rune : ${event.energy ? '+1 énergie, ' : ''}+1 Power ${domainName(event.power)}.`
        : `${playerName(event.playerId)} Tap une rune : +1 énergie.`;
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

/** Dés fixes de la démonstration après sélection des champs, puis mulligans.
 * stopAtMulligan=true laisse les joueurs choisir (fenêtre de mulligan ouverte) ;
 * sinon chacun garde sa main et la partie démarre en Main. */
export function prepareDemo(
  state: GameState,
  stopAtMulligan = false,
): GameState {
  state = requireState(recordOpeningRoll(state, { a: 19, b: 8 }));
  state = requireState(
    act(state, {
      type: 'choose-first-player',
      playerId: 'a',
      firstPlayerId: 'a',
    }),
  );
  if (stopAtMulligan) return state;
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
    .filter((a) =>
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
    mulliganPlayer(state) ??
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
    session.state.units.find((u) => u.id === cardId) ??
    session.state.gears?.find((g) => g.id === cardId);
  if (!instance) return [];
  return getLegalActions(session.state, instance.ownerId).filter(
    (a) =>
      ((a.type === 'cast-spell' ||
        a.type === 'play-unit' ||
        a.type === 'play-gear') &&
        a.cardId === cardId) ||
      (a.type === 'equip-gear' && a.gearId === cardId) ||
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

/** Action complète -> cibles cliquables : séquence ordonnée (unité, seconde unité, zone) ou
 * ensemble non ordonné (listes d'unités : Flash, Singularity). Cibles joueur et destinations
 * de jetons ne se cliquent pas : elles restent proposées au panneau. */
function targetPlan(
  state: GameState,
  action: GameAction,
): { ordered: boolean; ids: string[] } {
  if (action.type === 'play-unit')
    return {
      ordered: true,
      ids: action.onPlayTargetId ? [action.onPlayTargetId] : [],
    };
  if (action.type !== 'cast-spell') return { ordered: true, ids: [] };
  if (action.selectedUnitIds)
    return { ordered: false, ids: [...action.selectedUnitIds] };
  const ids: string[] = [];
  // Joueur (effet global) ou sort de la pile (contre, choisi au panneau) : rien à cliquer.
  if (
    !state.players.some((p) => p.id === action.targetId) &&
    !state.stack?.entries.some(
      (e) => 'card' in e && e.card.id === action.targetId,
    )
  )
    ids.push(action.targetId);
  if (action.secondaryTargetId) ids.push(action.secondaryTargetId);
  if (action.destinationId) ids.push(action.destinationId);
  return { ordered: true, ids };
}

function fits(
  plan: { ordered: boolean; ids: string[] },
  picks: readonly string[],
): boolean {
  return plan.ordered
    ? picks.every((id, i) => plan.ids[i] === id)
    : remaining(plan.ids, picks) !== null;
}

/** Multi-ensemble des cibles prévues moins les choix (une unité peut figurer plusieurs
 * fois, ex. Falling Star) ; null si un choix n'y figure pas assez de fois. */
function remaining(
  ids: readonly string[],
  picks: readonly string[],
): string[] | null {
  const left = [...ids];
  for (const id of picks) {
    const index = left.indexOf(id);
    if (index < 0) return null;
    left.splice(index, 1);
  }
  return left;
}

/** Carte + cibles cliquées -> actions encore compatibles, prochaines cibles cliquables
 * (unités ou zones, sans doublon) et actions complètes prêtes à valider. Lecture seule. */
export function targetOptions(
  session: Session,
  cardId: string,
  picks: readonly string[],
  destinationId?: string,
): { actions: GameAction[]; next: string[]; complete: GameAction[] } {
  const state = session.state;
  const actions = cardActions(session, cardId).filter(
    (action) =>
      !(
        destinationId &&
        action.type === 'play-unit' &&
        action.destinationId !== destinationId
      ) && fits(targetPlan(state, action), picks),
  );
  const next = actions.flatMap((action) => {
    const plan = targetPlan(state, action);
    return plan.ordered
      ? plan.ids.slice(picks.length, picks.length + 1)
      : (remaining(plan.ids, picks) ?? []);
  });
  const complete = actions.filter(
    (action) => targetPlan(state, action).ids.length === picks.length,
  );
  return { actions, next: [...new Set(next)], complete };
}

/** Bouton « Lancer » -> mode ciblage, sans rien payer. Une carte sans aucune cible à cliquer
 * et une seule option est lancée directement. */
export function startTargeting(
  session: Session,
  selection: Selection,
): { session: Session; selection: Selection | null } {
  const options = targetOptions(session, selection.cardId, []);
  const [only] = options.actions;
  if (options.actions.length === 1 && only && options.complete.length === 1) {
    const next = submitCardAction(session, selection.cardId, only);
    return { session: next, selection: next.error ? selection : null };
  }
  return {
    session: session.error ? { ...session, error: null } : session,
    selection: { ...selection, targeting: true, picks: [] },
  };
}

/** Clic sur une unité ou zone en mode ciblage -> ajoute la cible, ou la retire si elle était
 * déjà choisie (dans une séquence ordonnée, les cibles suivantes sont retirées aussi).
 * Cible illégale : message, partie et sélection inchangées. Ne lance jamais le sort. */
export function toggleTarget(
  session: Session,
  selection: Selection,
  id: string,
): { session: Session; selection: Selection } {
  const picks = selection.picks ?? [];
  const index = picks.indexOf(id);
  const unordered = cardActions(session, selection.cardId).some(
    (a) => a.type === 'cast-spell' && a.selectedUnitIds !== undefined,
  );
  // Cible répétable (plusieurs instructions sur la même unité) : un nouveau clic l'ajoute.
  const repeat =
    index >= 0 &&
    targetOptions(
      session,
      selection.cardId,
      [...picks, id],
      selection.destinationId,
    ).actions.length > 0;
  const nextPicks =
    index >= 0 && !repeat
      ? [...picks.slice(0, index), ...(unordered ? picks.slice(index + 1) : [])]
      : [...picks, id];
  if (
    (index < 0 || repeat) &&
    !targetOptions(
      session,
      selection.cardId,
      nextPicks,
      selection.destinationId,
    ).actions.length
  )
    return {
      session: {
        ...session,
        error: 'Cette carte n’est pas une cible possible pour ce choix.',
      },
      selection,
    };
  return {
    session: session.error ? { ...session, error: null } : session,
    selection: { ...selection, picks: nextPicks },
  };
}

/** Bouton « Valider » -> paiement et empilement de l'unique action complète. Aucune action
 * complète ou plusieurs (à départager au panneau) : refus sans modifier la partie. */
export function confirmTargets(
  session: Session,
  selection: Selection,
): { session: Session; selection: Selection | null } {
  const { complete } = targetOptions(
    session,
    selection.cardId,
    selection.picks ?? [],
    selection.destinationId,
  );
  const [only] = complete;
  if (complete.length !== 1 || !only)
    return {
      session: {
        ...session,
        error: complete.length
          ? 'Plusieurs options correspondent : choisis-la dans le panneau.'
          : 'Choisis d’abord les cibles en surbrillance.',
      },
      selection,
    };
  const next = submitCardAction(session, selection.cardId, only);
  return { session: next, selection: next.error ? selection : null };
}

/** Joueur + état -> runes à redresser en fin de tour (Dark Child) : nombre exigé et runes
 * proposées par le moteur. null si sa légende n'a pas cet effet ou si la fin est impossible. */
export function endTurnRuneChoice(
  state: GameState,
  playerId: string,
): { count: number; runeIds: string[] } | null {
  const ends = getLegalActions(state, playerId).filter(
    (a): a is Extract<GameAction, { type: 'end-turn' }> =>
      a.type === 'end-turn' && a.readyRuneIds !== undefined,
  );
  if (!ends.length) return null;
  return {
    count: ends[0]!.readyRuneIds!.length,
    runeIds: [...new Set(ends.flatMap((a) => a.readyRuneIds!))],
  };
}

/** Choix automatique de fin de tour : runes Tap d'abord, puis Ready, dans l'ordre du plateau.
 * Déterministe ; [] si aucun choix de runes n'est demandé. */
export function autoEndRunes(state: GameState, playerId: string): string[] {
  const choice = endTurnRuneChoice(state, playerId);
  if (!choice) return [];
  const ready = (id: string) =>
    state.cards.find((c) => c.id === id)?.ready !== false;
  return [
    ...choice.runeIds.filter((id) => !ready(id)),
    ...choice.runeIds.filter(ready),
  ].slice(0, choice.count);
}

/** Bouton « Terminer le tour » -> fin de tour du joueur actif, avec les runes choisies si sa
 * légende en demande. Ordre des runes indifférent ; choix incomplet ou illégal refusé sans
 * modifier la partie. */
export function endTurn(
  session: Session,
  runeIds: readonly string[] = [],
): Session {
  const playerId = session.state.activePlayerId;
  const choice = endTurnRuneChoice(session.state, playerId);
  if (!choice) return dispatch(session, { type: 'end-turn', playerId });
  const key = (ids: readonly string[]) => [...ids].sort().join('|');
  const action = getLegalActions(session.state, playerId).find(
    (a) =>
      a.type === 'end-turn' &&
      a.readyRuneIds !== undefined &&
      key(a.readyRuneIds) === key(runeIds),
  );
  return action
    ? dispatch(session, action)
    : {
        ...session,
        error: `Choisis ${choice.count} rune(s) à redresser avant de terminer le tour.`,
      };
}

/** Clic (tap) ou clic droit (recycle) sur une rune -> ressource dans la réserve flottante du
 * propriétaire de la rune. Le moteur vérifie la fenêtre ; un refus ne change pas la partie. */
export function useRune(
  session: Session,
  runeId: string,
  mode: 'tap' | 'recycle',
): Session {
  const rune = session.state.cards.find((c) => c.id === runeId);
  if (!rune) return { ...session, error: refusals.INVALID_RUNE! };
  return dispatch(session, {
    type: mode === 'tap' ? 'tap-rune' : 'recycle-rune',
    playerId: rune.ownerId,
    runeId,
  });
}

/** Joueur qui doit choisir son mulligan : le premier joueur, puis les suivants dans l'ordre
 * de la table. null hors de la fenêtre de mulligan ou une fois tous les choix faits. */
export function mulliganPlayer(state: GameState): string | null {
  const setup = state.setup;
  if (setup?.stage !== 'mulligan') return null;
  const ids = state.players.map((p) => p.id);
  const start = Math.max(0, ids.indexOf(state.activePlayerId));
  const order = [...ids.slice(start), ...ids.slice(0, start)];
  return order.find((id) => !setup.completedPlayerIds.includes(id)) ?? null;
}

/** Cartes choisies par le joueur du mulligan (0 à 2) -> remplacement sous le deck et pioche.
 * Le premier tour démarre après le dernier choix. Refus sans modifier la partie. */
export function confirmMulligan(
  session: Session,
  cardIds: readonly string[],
): Session {
  const playerId = mulliganPlayer(session.state);
  if (!playerId)
    return { ...session, error: 'Aucun mulligan n’est en attente.' };
  if (cardIds.length > 2)
    return { ...session, error: refusals.INVALID_MULLIGAN! };
  return dispatch(session, { type: 'mulligan', playerId, cardIds });
}

/** Clic sur une carte de la main pendant une défausse imposée (Traveling Merchant) ->
 * défausse de cette carte et reprise de la résolution. Refus sans modifier la partie. */
export function discardFromHand(session: Session, cardId: string): Session {
  const pending = session.state.pendingDiscard;
  if (!pending)
    return { ...session, error: 'Aucune défausse n’est en attente.' };
  return dispatch(session, {
    type: 'choose-discard',
    playerId: pending.playerId,
    cardId,
  });
}

/** Clic sur un gear à capacité de ressource -> Tap et ressource pour son propriétaire.
 * Le moteur vérifie la fenêtre ; un refus ne change pas la partie. */
export function useGear(session: Session, gearId: string): Session {
  const gear = session.state.gears?.find((g) => g.id === gearId);
  if (!gear) return { ...session, error: refusals.INVALID_GEAR! };
  return dispatch(session, {
    type: 'activate-gear',
    playerId: gear.ownerId,
    gearId,
  });
}

/** Gear avec une capacité de ressource activable au clic ? */
export function gearHasResource(state: GameState, gearId: string): boolean {
  const gear = state.gears?.find((g) => g.id === gearId);
  return !!state.gearDefinitions?.find((d) => d.id === gear?.definitionId)
    ?.resourceAbility;
}
