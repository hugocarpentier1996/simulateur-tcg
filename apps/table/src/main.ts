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
  useGear,
  gearHasResource,
  targetOptions,
  endTurn,
  endTurnRuneChoice,
  autoEndRunes,
  useRune,
  mulliganPlayer,
  confirmMulligan,
  setPreference,
  clickChoices,
  multiPickOptions,
} from './session.js';
import {
  renderTable,
  stackTopKey,
  cursorHint,
  type PendingReset,
  type Selection,
  type TableUi,
} from './view.js';
import type { PreferenceKey } from '../../../packages/game-engine/src/index.js';
import { zoomImage, zoomPosition } from './zoom.js';
import { damageAssigner, damagePlan, toggleDamagePick } from './damage-plan.js';
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
let lastStackTop: string | null = null;
// Dégâts de combat : unités cliquées (remises à zéro quand le joueur à répartir change).
let damagePicks: string[] = [];
let damageKey: string | null = null;
// Choix à plusieurs cibles : cartes cliquées (remises à zéro quand l'état change de choix).
let multiPicks: string[] = [];
let multiKey: unknown = null;
let reactionOpen = false;

function render() {
  displayedCardActions = selection
    ? cardActions(session, selection.cardId)
    : [];
  const focusId = document.activeElement?.id;
  // Fenêtre de réaction : rouverte dès qu'une nouvelle entrée arrive au sommet de la pile.
  // Clé : sommet + joueur prioritaire, pour que chaque joueur voie la fenêtre à son tour.
  const top = stackTopKey(session.state)
    ? `${stackTopKey(session.state)}:${session.state.stack?.priorityPlayerId}`
    : null;
  if (top !== lastStackTop) {
    lastStackTop = top;
    reactionOpen = top !== null;
  }
  const blocking =
    session.state.pendingModeChoice ||
    session.state.pendingVision ||
    session.state.pendingPick ||
    session.state.pendingDiscard ||
    session.state.pendingDeaths ||
    session.state.pendingAttackChoices?.length;
  const assigner = damageAssigner(session.state);
  const key = assigner
    ? `${assigner}:${session.state.showdown?.battlefieldId}`
    : null;
  if (key !== damageKey) {
    damageKey = key;
    damagePicks = [];
  }
  const pendingChoice =
    session.state.pendingModeChoice ?? session.state.pendingAttackChoices;
  if (pendingChoice !== multiKey) {
    multiKey = pendingChoice;
    multiPicks = [];
  }
  const ui: TableUi = {
    multiPicks,
    damagePicks,
    reactionPopup: reactionOpen && !!session.state.stack && !blocking,
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
  // Répartition des dégâts au clic, puis validation.
  const assigner = damageAssigner(session.state);
  if (assigner) {
    const unitId = target.closest<HTMLElement>('[data-card]')?.dataset.card;
    if (resetAction === 'damage-confirm') {
      const plan = damagePlan(session.state, assigner, damagePicks);
      if (plan?.valid)
        session = dispatch(session, {
          type: 'assign-damage',
          playerId: assigner,
          allocations: plan.allocations,
        });
      render();
      return;
    }
    if (resetAction === 'damage-reset') {
      damagePicks = [];
      render();
      return;
    }
    if (unitId && session.state.units.some((u) => u.id === unitId)) {
      const plan = damagePlan(session.state, assigner, damagePicks);
      const chosen = plan?.allocations.some((a) => a.targetId === unitId);
      if (chosen || plan?.next.includes(unitId))
        damagePicks = toggleDamagePick(
          plan!.allocations.map((a) => a.targetId),
          unitId,
        );
      render();
      return;
    }
  }
  // Choix du moteur désignant une carte ou une zone (Fortified Position, buffs, cibles de
  // capacités…) : un clic sur l'élément le déclenche.
  const clickedId = targetId(target);
  // Plusieurs cibles : cliquer ajoute ou retire ; dès qu'un choix complet et unique est
  // atteint, il est envoyé.
  if (!selection && !moves.length && clickedId) {
    const multi = multiPickOptions(session, multiPicks);
    if (
      multi.active &&
      (multi.next.includes(clickedId) || multiPicks.includes(clickedId))
    ) {
      multiPicks = multiPicks.includes(clickedId)
        ? multiPicks.filter((id) => id !== clickedId)
        : [...multiPicks, clickedId];
      const after = multiPickOptions(session, multiPicks);
      if (after.complete.length === 1 && !after.next.length) {
        session = dispatch(session, after.complete[0]!);
        multiPicks = [];
      }
      render();
      return;
    }
  }
  if (!selection && !moves.length && clickedId) {
    const choice = clickChoices(session).get(clickedId);
    if (choice) {
      session = dispatch(session, choice);
      render();
      return;
    }
  }
  // Fenêtre de réaction : passer pour le joueur prioritaire, ou la fermer pour réagir.
  if (resetAction === 'reaction-pass' && session.state.stack) {
    session = dispatch(session, {
      type: 'pass',
      playerId: session.state.stack.priorityPlayerId,
    });
    selection = null;
    render();
    return;
  }
  if (resetAction === 'reaction-hide') {
    reactionOpen = false;
    render();
    return;
  }
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
  // Gear : capacité de ressource au clic, sinon sélection (options d'équipement au panneau).
  const gearId = target.closest<HTMLElement>('[data-gear]')?.dataset.gear;
  if (gearId && isTarget(gearId)) {
    chooseTarget(gearId);
    return;
  }
  if (gearId && !moves.length) {
    if (gearHasResource(session.state, gearId))
      session = useGear(session, gearId);
    else selection = { cardId: gearId };
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
root.addEventListener('change', (event) => {
  const input = event.target as HTMLInputElement | null;
  const key = input?.dataset.pref as PreferenceKey | undefined;
  const player = input?.dataset.player;
  if (!input || !key || !player) return;
  session = setPreference(session, player, key, input.checked);
  render();
});

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

// Agrandissement au survol : aperçu flottant hors de #app (survit aux rendus).
const zoom = document.createElement('div');
zoom.id = 'card-zoom';
zoom.setAttribute('aria-hidden', 'true');
document.body.append(zoom);
function hideZoom() {
  zoom.classList.remove('visible');
  zoom.innerHTML = '';
}
function placeZoom(x: number, y: number) {
  const rect = zoom.getBoundingClientRect();
  const { left, top } = zoomPosition(
    x,
    y,
    rect.width,
    rect.height,
    window.innerWidth,
    window.innerHeight,
  );
  zoom.style.left = `${left}px`;
  zoom.style.top = `${top}px`;
}
root.addEventListener('pointerover', (event) => {
  if (event.pointerType === 'touch' || event.buttons) return;
  const img = zoomImage(event.target as Element);
  if (!img) return hideZoom();
  const landscape = img.naturalWidth > img.naturalHeight;
  zoom.className = `visible${landscape ? ' landscape' : ''}`;
  zoom.innerHTML = `<img src="${img.src}" alt="">`;
  placeZoom(event.clientX, event.clientY);
});
root.addEventListener('pointermove', (event) => {
  if (zoom.classList.contains('visible'))
    placeZoom(event.clientX, event.clientY);
});
root.addEventListener('pointerleave', hideZoom);
root.addEventListener('pointerdown', hideZoom);

/** Identifiant de l'élément de jeu sous le pointeur : carte, unité, gear, rune ou zone. */
function targetId(target: Element | null): string | undefined {
  const el = target?.closest<HTMLElement>(
    '[data-card],[data-gear],[data-rune],[data-zone]',
  );
  return (
    el?.dataset.card ?? el?.dataset.gear ?? el?.dataset.rune ?? el?.dataset.zone
  );
}

// Indication près du curseur : effet appliqué ou choix demandé par le clic.
const hint = document.createElement('div');
hint.id = 'cursor-hint';
hint.setAttribute('role', 'status');
document.body.append(hint);
root.addEventListener('pointermove', (event) => {
  const id = targetId(event.target as Element);
  const text = id ? cursorHint(session, selection, { damagePicks }, id) : null;
  if (!text) {
    hint.classList.remove('visible');
    return;
  }
  hint.textContent = text;
  hint.classList.add('visible');
  hint.style.left = `${Math.min(event.clientX + 16, window.innerWidth - hint.offsetWidth - 8)}px`;
  hint.style.top = `${Math.max(8, event.clientY - 34)}px`;
});
root.addEventListener('pointerleave', () => hint.classList.remove('visible'));
