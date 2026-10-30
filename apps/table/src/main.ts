import { createStarterSession } from './starter-session.js';
import { planMove, confirmMoves, type PlannedMove } from './move-plan.js';
import {
  createDemo,
  cardActions,
  submitCardAction,
  tableActions,
  dispatch,
  boardOptions,
  playOrMove,
  undo,
  passShowdown,
  toggleTarget,
  startTargeting,
  confirmTargets,
  discardFromHand,
  targetOptions,
  endTurn,
  endTurnRuneChoice,
  autoEndRunes,
  useRune,
  mulliganPlayer,
  confirmMulligan,
} from './session.js';
import {
  renderTable,
  type PendingReset,
  type Selection,
  type TableUi,
} from './view.js';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#app')!;
// L'entropie appartient au navigateur ; la simulation reçoit une graine explicite.
const newStarterGame = () =>
  createStarterSession(crypto.getRandomValues(new Uint32Array(1))[0]!, {
    mulligan: true,
  });
let session = newStarterGame();
let selection: Selection | null = null;
let suppressClick = false;
let moves: readonly PlannedMove[] = [];
let displayedCardActions: ReturnType<typeof cardActions> = [];
let pendingReset: PendingReset = null;
// Runes cliquées pour l'effet de fin de tour (null hors sélection) et réglage « Auto » par joueur.
let endRunes: string[] | null = null;
let graveyard: string | null = null;
// Cartes marquées pour le mulligan du joueur en cours (remises à zéro à chaque validation).
let mulliganPick: string[] = [];
const autoRunes: Record<string, boolean> = {};

function render() {
  displayedCardActions = selection
    ? cardActions(session, selection.cardId)
    : [];
  const focusId = document.activeElement?.id;
  const ui: TableUi = {
    endRunes,
    autoRunes,
    graveyard,
    mulligan: mulliganPick,
  };
  root.innerHTML = renderTable(session, selection, moves, pendingReset, ui);
  if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
}

/** En mode ciblage, unité ou zone cliquable : cible proposée par le moteur ou déjà choisie. */
function isTarget(id: string): boolean {
  return (
    !!selection?.targeting &&
    ((selection.picks ?? []).includes(id) ||
      targetOptions(
        session,
        selection.cardId,
        selection.picks ?? [],
        selection.destinationId,
      ).next.includes(id))
  );
}

function chooseTarget(id: string) {
  if (!selection) return;
  const picked = toggleTarget(session, selection, id);
  session = picked.session;
  selection = picked.selection;
  render();
}

/** Fin de tour : directe sans effet de légende ; sinon runes automatiques (« Auto »)
 * ou sélection sur le plateau, validée par un second clic une fois complète. */
function endTurnClicked() {
  const playerId = session.state.activePlayerId;
  const choice = endTurnRuneChoice(session.state, playerId);
  if (choice && !autoRunes[playerId] && !endRunes) {
    endRunes = [];
    selection = null;
    return;
  }
  session = endTurn(
    session,
    choice && autoRunes[playerId]
      ? autoEndRunes(session.state, playerId)
      : (endRunes ?? []),
  );
  if (!session.error) {
    selection = null;
    endRunes = null;
  }
}

function toggleEndRune(runeId: string) {
  const choice = endTurnRuneChoice(session.state, session.state.activePlayerId);
  if (!choice || !endRunes || !choice.runeIds.includes(runeId)) return;
  endRunes = endRunes.includes(runeId)
    ? endRunes.filter((id) => id !== runeId)
    : endRunes.length < choice.count
      ? [...endRunes, runeId]
      : endRunes;
  render();
}

function place(destinationId: string) {
  if (!selection) return;
  if (isTarget(destinationId)) {
    chooseTarget(destinationId);
    return;
  }
  if (session.state.units.some((u) => u.id === selection!.cardId)) {
    const planned = planMove(session, moves, selection.cardId, destinationId);
    session = {
      ...session,
      error: planned === moves ? 'Déplacement indisponible.' : null,
    };
    moves = planned;
  } else if (moves.length) {
    session = {
      ...session,
      error: 'Valide ou annule les déplacements avant de jouer une carte.',
    };
  } else {
    const options = cardActions(session, selection.cardId).filter(
      (a) => a.type === 'play-unit' && a.destinationId === destinationId,
    );
    if (options.length > 1) {
      selection = { ...selection, destinationId, targeting: true, picks: [] };
      render();
      return;
    }
    session = playOrMove(session, selection.cardId, destinationId);
  }
  if (!session.error) selection = null;
  render();
}

root.addEventListener('click', (event) => {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  const target = event.target as HTMLElement;
  // Une remise à zéro en attente fige la table jusqu'à sa confirmation ou son abandon.
  const resetAction = target.closest<HTMLElement>('button')?.dataset.action;
  if (
    pendingReset &&
    resetAction !== 'confirm-reset' &&
    resetAction !== 'cancel-reset'
  )
    return;
  // La défausse est une consultation : elle s'ouvre et se ferme dans tous les contextes
  // (déplacements préparés, choix de runes, ciblage), sans toucher à la partie.
  const pile = target.closest<HTMLElement>('[data-graveyard]');
  if (pile || resetAction === 'close-graveyard') {
    graveyard =
      pile && graveyard !== pile.dataset.graveyard
        ? pile.dataset.graveyard!
        : null;
    render();
    return;
  }
  // Mulligan : la main sert à marquer jusqu'à 2 cartes, le bouton valide le choix.
  const mulliganBy = mulliganPlayer(session.state);
  if (mulliganBy) {
    const picked = target.closest<HTMLElement>('[data-card]')?.dataset.card;
    const inHand = session.state.cards.some(
      (c) =>
        c.id === picked &&
        session.state.zones.some(
          (z) =>
            z.id === c.zoneId && z.kind === 'hand' && z.ownerId === mulliganBy,
        ),
    );
    if (picked && inHand) {
      mulliganPick = mulliganPick.includes(picked)
        ? mulliganPick.filter((id) => id !== picked)
        : mulliganPick.length < 2
          ? [...mulliganPick, picked]
          : mulliganPick;
      render();
      return;
    }
    if (resetAction === 'confirm-mulligan') {
      session = confirmMulligan(session, mulliganPick);
      if (!session.error) mulliganPick = [];
      render();
      return;
    }
  }
  // Défausse imposée (Traveling Merchant) : un clic sur une carte de la main la défausse.
  const discarding = session.state.pendingDiscard;
  const handCard = target.closest<HTMLElement>('[data-card]')?.dataset.card;
  if (
    discarding &&
    handCard &&
    session.state.cards.some(
      (c) =>
        c.id === handCard &&
        session.state.zones.some(
          (z) =>
            z.id === c.zoneId &&
            z.kind === 'hand' &&
            z.ownerId === discarding.playerId,
        ),
    )
  ) {
    session = discardFromHand(session, handCard);
    selection = null;
    render();
    return;
  }
  const rune = target.closest<HTMLElement>('[data-rune]');
  if (rune && endRunes) {
    toggleEndRune(rune.dataset.rune!);
    return;
  }
  if (rune && !moves.length) {
    session = useRune(session, rune.dataset.rune!, 'tap');
    render();
    return;
  }
  const zone = target.closest<HTMLElement>('[data-zone]');
  if (zone && selection && !target.closest('[data-card]')) {
    place(zone.dataset.zone!);
    return;
  }
  const button = target.closest<HTMLButtonElement>('button');
  if (!button) return;
  if (button.disabled) return;
  if (button.dataset.action === 'confirm-moves') {
    session = confirmMoves(session, moves);
    if (!session.error) {
      moves = [];
      selection = null;
    }
    render();
    return;
  }
  if (button.dataset.action === 'cancel-moves') {
    moves = [];
    selection = null;
    session = { ...session, error: null };
    render();
    return;
  }
  if (
    moves.length &&
    !button.dataset.card &&
    button.dataset.action !== 'cancel'
  )
    return;
  if (button.dataset.cardAction !== undefined && selection) {
    const action = displayedCardActions[Number(button.dataset.cardAction)];
    if (action) session = submitCardAction(session, selection.cardId, action);
    if (!session.error) selection = null;
  } else if (button.dataset.choice !== undefined) {
    const action = tableActions(session)[Number(button.dataset.choice)];
    if (action) session = dispatch(session, action);
    selection = null;
  } else if (
    button.dataset.card &&
    (isTarget(button.dataset.card) ||
      (selection?.targeting &&
        session.state.units.some((u) => u.id === button.dataset.card)))
  ) {
    // En ciblage, une unité du plateau est une cible (ou un refus expliqué), jamais une sélection.
    chooseTarget(button.dataset.card);
    return;
  } else if (button.dataset.card) {
    selection = { cardId: button.dataset.card };
    session = { ...session, error: null };
  } else if (button.dataset.action === 'pass') {
    session = passShowdown(session);
    selection = null;
  } else if (button.dataset.action === 'undo') {
    session = undo(session);
    selection = null;
    mulliganPick = [];
  } else if (button.dataset.action === 'cancel') selection = null;
  else if (button.dataset.action === 'end') endTurnClicked();
  else if (button.dataset.action === 'cancel-end') endRunes = null;
  else if (button.dataset.action === 'start-targeting' && selection) {
    const started = startTargeting(session, selection);
    session = started.session;
    selection = started.selection;
  } else if (button.dataset.action === 'confirm-targets' && selection) {
    const cast = confirmTargets(session, selection);
    session = cast.session;
    selection = cast.selection;
  } else if (button.dataset.action === 'toggle-auto-runes') {
    const playerId = session.state.activePlayerId;
    autoRunes[playerId] = !autoRunes[playerId];
    // Le mode automatique remplace une sélection manuelle en cours.
    if (autoRunes[playerId]) endRunes = null;
  } else if (
    button.dataset.action === 'reset' ||
    button.dataset.action === 'bo3'
  ) {
    pendingReset = button.dataset.action;
  } else if (button.dataset.action === 'confirm-reset' && pendingReset) {
    session =
      pendingReset === 'bo3' ? createDemo(true, 'bo3') : newStarterGame();
    pendingReset = null;
    selection = null;
    mulliganPick = [];
  } else if (button.dataset.action === 'cancel-reset') pendingReset = null;
  else return;
  render();
});

// Clic droit sur une rune : recyclage sous le deck de runes (Power, + énergie si Ready).
root.addEventListener('contextmenu', (event) => {
  const rune = (event.target as HTMLElement).closest<HTMLElement>(
    '[data-rune]',
  );
  if (!rune || pendingReset || endRunes || moves.length) return;
  event.preventDefault();
  session = useRune(session, rune.dataset.rune!, 'recycle');
  render();
});

// Le pointeur unifie souris et tactile ; le clic reste une alternative au déplacement.
let gesture: {
  cardId: string;
  x: number;
  y: number;
  source: HTMLElement;
  ghost: HTMLElement | null;
  targets: string[];
} | null = null;
root.addEventListener('dragstart', (event) => event.preventDefault());
root.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || pendingReset) return;
  suppressClick = false;
  const source = (event.target as HTMLElement).closest<HTMLElement>(
    '[data-card]',
  );
  if (!source) return;
  const cardId = source.dataset.card!;
  gesture = {
    cardId,
    x: event.clientX,
    y: event.clientY,
    source,
    ghost: null,
    targets: boardOptions(session.state, cardId).map((a) => a.destinationId!),
  };
});
root.addEventListener('pointermove', (event) => {
  if (!gesture || !gesture.targets.length) return;
  if (
    !gesture.ghost &&
    Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 7
  )
    return;
  event.preventDefault();
  if (!gesture.ghost) {
    root.setPointerCapture(event.pointerId);
    selection = { cardId: gesture.cardId };
    gesture.ghost = gesture.source.cloneNode(true) as HTMLElement;
    gesture.ghost.removeAttribute('id');
    gesture.ghost.removeAttribute('data-card');
    gesture.ghost.className = 'card drag-ghost';
    gesture.ghost.setAttribute('aria-hidden', 'true');
    document.body.append(gesture.ghost);
    root
      .querySelectorAll<HTMLElement>('[data-zone]')
      .forEach((zone) =>
        zone.classList.toggle(
          'drop-target',
          gesture!.targets.includes(zone.dataset.zone!),
        ),
      );
  }
  gesture.ghost.style.left = event.clientX - 65 + 'px';
  gesture.ghost.style.top = event.clientY - 35 + 'px';
});
root.addEventListener('pointerup', (event) => {
  if (!gesture) return;
  const moved = !!gesture.ghost;
  gesture.ghost?.remove();
  gesture = null;
  if (!moved) return;
  suppressClick = true;
  if (root.hasPointerCapture(event.pointerId))
    root.releasePointerCapture(event.pointerId);
  const zone = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest<HTMLElement>('[data-zone]');
  if (zone) place(zone.dataset.zone!);
  else render();
});
root.addEventListener('pointercancel', () => {
  gesture?.ghost?.remove();
  gesture = null;
  render();
});

render();
