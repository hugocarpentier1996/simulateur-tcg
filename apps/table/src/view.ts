import type { PlannedMove } from './move-plan.js';
import { cardInfo } from './catalogue.js';
import {
  act,
  effectiveMight,
  type CardInstance,
  type GameAction,
  type GameState,
} from '../../../packages/game-engine/src/index.js';
import {
  cardName,
  cardActions,
  handPlayer,
  targetOptions,
  endTurnRuneChoice,
  domainName,
  mulliganPlayer,
  tableActions,
  playerName,
  boardOptions,
  type Session,
} from './session.js';
import { fanLayout } from './fan.js';

/** Sélection locale, sans conséquence sur la partie avant validation par act. */
export interface Selection {
  cardId: string;
  destinationId?: string;
  /** Mode ciblage ouvert par « Lancer » (ou après le dépôt d'une unité à cible). */
  targeting?: boolean;
  /** Cibles déjà cliquées sur le plateau, dans l'ordre du choix (ex. Duel : alliée puis ennemie). */
  picks?: readonly string[];
}

const escape = (text: string | number) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );
const count = (state: GameState, ownerId: string, kind: string) =>
  state.cards.filter((c) =>
    state.zones.some(
      (z) => z.id === c.zoneId && z.ownerId === ownerId && z.kind === kind,
    ),
  ).length;
const powerText = (power: Readonly<Record<string, number>>) =>
  Object.entries(power)
    .map(([color, n]) => `${n} ${domainName(color)}`)
    .join(' + ') || '0';

function art(id: string, className: string): string {
  const info = cardInfo(id);
  return info?.imageLocal
    ? `<img class="${className}" src="${escape(info.imageLocal)}" alt="${escape(info.displayName ?? info.name)}" loading="lazy" draggable="false">`
    : '';
}

function card(
  card: CardInstance,
  selected: Selection | null,
  champion = false,
  extraClass = '',
): string {
  const def = {
    name: card.definitionId,
    might: 0,
    cost: { energy: 0, power: {} },
    ...cardInfo(card.definitionId),
  };
  if (def.imageLocal)
    return `<button type="button" class="card illustrated-card ${selected?.cardId === card.id ? 'selected' : ''}${extraClass ? ` ${extraClass}` : ''}" id="card-${escape(card.id)}" data-card="${escape(card.id)}" aria-pressed="${selected?.cardId === card.id}" title="${escape(cardName(card.definitionId))} · ${escape(def.tags?.join(' · ') ?? '')}">${art(card.definitionId, 'card-art')}<span class="sr-only">${champion ? 'Chosen champion · ' : ''}${escape(cardName(card.definitionId))}</span></button>`;
  return `<button type="button" class="card ${selected?.cardId === card.id ? 'selected' : ''}${extraClass ? ` ${extraClass}` : ''}" id="card-${escape(card.id)}" draggable="false" data-card="${escape(card.id)}" aria-pressed="${selected?.cardId === card.id}">
    <span class="card-type">${champion ? 'Chosen champion' : 'Unité'}</span>
    <span class="sigil" aria-hidden="true">${def.might === 0 ? '◇' : '♜'}</span>
    <strong>${escape(def.name.replace(' de test', ''))}</strong>
    <span class="card-cost">${def.cost.energy} énergie · ${escape(powerText(def.cost.power))} Power</span>
    <span class="card-footer"><span>Arrive Tap</span><b>${def.might}<small> Might</small></b></span>
  </button>`;
}

function zone(
  state: GameState,
  zoneId: string,
  title: string,
  subtitle: string,
  battlefield = false,
  destinations: readonly string[] = [],
  moves: readonly PlannedMove[] = [],
  picked: readonly string[] = [],
): string {
  const units = state.units.filter((u) => u.zoneId === zoneId);
  const gears = (state.gears ?? []).filter((g) => g.zoneId === zoneId);
  const gearCards = gears
    .map((g) => {
      const label = `${cardName(g.definitionId)} · ${playerName(g.ownerId)} · ${g.ready ? 'Ready' : 'Tap'}${g.attachedUnitId ? ' · équipé' : ''}`;
      return `<div class="gear-slot"><button type="button" data-gear="${escape(g.id)}" class="gear-card ${g.ready ? 'ready' : 'tapped'}${g.attachedUnitId ? ' attached' : ''}" aria-label="${escape(label)}" title="${escape(label)}"><span class="gear-face">${art(g.definitionId, 'gear-art') || `<span class="unit-fallback">${escape(cardName(g.definitionId))}</span>`}</span></button></div>`;
    })
    .join('');
  return `<section data-zone="${escape(zoneId)}" class="zone ${destinations.includes(zoneId) ? 'drop-target' : ''}${picked.includes(zoneId) ? ' picked' : ''} ${battlefield ? 'battlefield' : 'base'}"><header><h3>${escape(title)}</h3><span>${escape(subtitle)}</span></header>
    ${battlefield ? art(state.battlefields.find((b) => b.zoneId === zoneId)?.definitionId ?? '', 'field-art') : ''}
    <div class="units">${
      units.length || gears.length
        ? gearCards +
          units
            .map((u) => {
              const label = `${cardName(u.definitionId)} · ${playerName(u.ownerId)} · ${u.ready ? 'Ready' : 'Tap'} · Might ${effectiveMight(u, state)} · ${u.damage} dégât(s)`;
              return `<div class="unit-slot"><button type="button" id="unit-${escape(u.id)}" data-card="${escape(u.id)}" class="unit-card ${u.ready ? 'ready' : 'tapped'}${destinations.includes(u.id) ? ' targetable' : ''}${picked.includes(u.id) ? ' picked' : ''}" aria-label="${escape(label)}" title="${escape(label)}"><span class="unit-face">${art(u.definitionId, 'unit-art') || `<span class="unit-fallback">${escape(cardName(u.definitionId))}</span>`}</span><span class="unit-might">${effectiveMight(u, state)}</span></button></div>`;
            })
            .join('')
        : moves.some((m) => m.destinationId === zoneId)
          ? ''
          : `<p class="empty">${battlefield ? 'Aucune unité sur ce champ' : 'Aucune unité en base'}</p>`
    }${movePreviews(state, zoneId, moves)}</div>${destinations.includes(zoneId) ? '<button type="button" class="place-here">Choisir cette destination</button>' : ''}</section>`;
}

function paymentPanel(session: Session, selection: Selection | null): string {
  if (selection) {
    const instance = session.state.cards.find((c) => c.id === selection.cardId);
    const options = cardActions(session, selection.cardId);
    if (instance || options.length)
      return selectedCardPanel(session, selection);
  }
  const choices = tableActions(session);
  const state = session.state;
  const visionCard = state.cards.find(
    (c) => c.id === state.pendingVision?.cardId,
  );
  const vision = visionCard
    ? `<p>Vision : ${escape(cardName(visionCard.definitionId))}</p>${art(visionCard.definitionId, 'card-preview')}`
    : '';
  if (
    (!selection &&
      choices.some((a) => a.type === 'end-turn' || a.type === 'pass')) ||
    state.pendingVision ||
    state.pendingDiscard ||
    state.pendingDeaths ||
    state.pendingAttackChoices?.length ||
    state.setup ||
    state.stack ||
    state.pendingDefenseShield ||
    state.pendingHoldChannel ||
    state.showdown
  ) {
    const heading = state.pendingVision
      ? 'Vision'
      : state.pendingDiscard
        ? 'Choisir une carte à défausser'
        : state.pendingDeaths
          ? 'Effets de mort'
          : state.pendingAttackChoices?.length
            ? 'Capacités d’attaque'
            : state.pendingDefenseShield
              ? 'Choisir une unité · Shield 2'
              : state.pendingHoldChannel
                ? 'Startipped Peak'
                : state.setup
                  ? 'Choisir les champs · BO3'
                  : state.stack
                    ? 'Réactions'
                    : state.showdown?.kind === 'combat' &&
                        state.showdown.stage === 'damage'
                      ? 'Répartir les dégâts'
                      : state.showdown
                        ? 'Combat Showdown'
                        : choices.some((a) => a.type === 'end-turn')
                          ? 'Fin de tour · Dark Child'
                          : 'Rendre la priorité';
    if (state.showdown) {
      const show = state.showdown;
      const priority = state.stack?.priorityPlayerId ?? show.priorityPlayerId;
      return `<section class="showdown-panel">${vision}<div class="eyebrow">${show.kind === 'combat' ? 'Combat Showdown' : 'Open Showdown'}</div><h3>Champ de bataille ${state.battlefields.findIndex((b) => b.zoneId === show.battlefieldId) + 1}</h3><p>Priorité : ${escape(playerName(priority))}</p><p class="help">${state.stack ? 'Réactions' : show.kind === 'combat' && show.stage === 'damage' ? 'Répartir les dégâts' : show.kind === 'combat' ? 'Les passes ouvrent la répartition des dégâts.' : 'Les passes clôturent la fenêtre de conquête.'}</p><p>${show.consecutivePasses} / ${show.participants.length} passes</p><div class="choice-list">${choices.map((a, i) => `<button class="${a.type === 'pass' ? 'primary' : 'quiet'}" data-choice="${i}">${escape(actionLabel(session, a))}</button>`).join('')}</div></section>`;
    }
    return `<div class="eyebrow">Choix du moteur</div><h3>${heading}</h3>${vision}<p class="help">${state.pendingDiscard ? 'Clique la carte de ta main à défausser, ou choisis-la ci-dessous.' : 'Les boutons proposent uniquement les actions actuellement autorisées.'}</p><div class="choice-list">${choices.map((a, i) => `<button class="quiet" data-choice="${i}">${escape(actionLabel(session, a))}</button>`).join('')}</div>`;
  }
  const unit = session.state.units.find((u) => u.id === selection?.cardId);
  if (unit) {
    const canMove = boardOptions(session.state, unit.id).length > 0;
    return `<div class="eyebrow">Déplacement</div><h3>${escape(cardName(unit.definitionId))}</h3><p class="help">${canMove ? 'Glisse cette unité Ready vers une zone éclairée, ou clique sa destination. Elle deviendra Tap, sans payer de coût.' : 'Déplacement indisponible. Une unité doit être Ready pendant ta Main. Base ↔ champ ; entre champs, Ganking est requis. Les champs adverses ouvrent un combat.'}</p><button class="quiet" data-action="cancel">Annuler la sélection</button>`;
  }
  if (!selection)
    return '<div class="selection-empty"><span aria-hidden="true">↙</span><h3>Pose une carte pour jouer</h3><p>Glisse une unité sur une zone éclairée. Son coût est payé automatiquement.</p><p>Tu peux aussi cliquer la carte, puis sa destination. Une unité Ready en base peut rejoindre un champ de bataille ; une présence adverse déclenche un combat.</p></div>';
  const instance = session.state.cards.find((c) => c.id === selection.cardId)!;
  const def = {
    cost: { energy: 0, power: {} },
    ...cardInfo(instance.definitionId),
  };
  const options = boardOptions(session.state, selection.cardId);
  return `<div class="eyebrow">Carte sélectionnée</div><h3>${escape(cardName(instance.definitionId))}</h3>${art(instance.definitionId, 'card-preview')}<p class="tags">${escape(def.tags?.join(' · ') ?? '')}</p><p class="cost-summary">${def.cost.energy} énergie + ${escape(powerText(def.cost.power))} Power</p><p class="payment-status" role="status">${options.length ? 'Pose la carte sur une zone éclairée. Le paiement sera effectué automatiquement.' : 'Cette carte n’est pas jouable maintenant : ressources insuffisantes ou fenêtre fermée.'}</p><p class="help">Les runes nécessaires seront épuisées pour l’Énergie et recyclées pour le Power.</p><button class="quiet" type="button" data-action="cancel">Annuler la sélection</button>`;
}

function resourceRow(
  state: GameState,
  ownerId: string,
  opponent = false,
  endRunes: readonly string[] | null = null,
): string {
  const runes = state.cards.filter((c) =>
    state.zones.some(
      (z) => z.id === c.zoneId && z.kind === 'runes' && z.ownerId === ownerId,
    ),
  );
  const pile = (kind: string, label: string, symbol: string) => {
    const content = `<div class="pile-face"><span aria-hidden="true">${symbol}</span><b>${count(state, ownerId, kind)}</b></div><small>${label}</small>`;
    return kind === 'graveyard'
      ? `<button type="button" class="pile ${kind}" data-graveyard="${escape(ownerId)}" aria-label="Parcourir la défausse de ${escape(playerName(ownerId))}" title="Parcourir la défausse">${content}</button>`
      : `<div class="pile ${kind}" aria-label="${escape(label)} de ${escape(playerName(ownerId))}">${content}</div>`;
  };
  return `<div class="resource-row ${opponent ? 'opponent-resources' : ''}" aria-label="Ressources de ${escape(playerName(ownerId))}">
    ${pile('rune-pile', 'Deck de runes', '◇')}
    <div class="rune-cards">${runes.length ? runes.map((r) => `<article class="rune-card ${escape(r.color ?? '')} ${r.ready ? 'ready' : 'tapped'}${endRunes ? ' choosable' : ''}${endRunes?.includes(r.id) ? ' chosen' : ''}" data-rune="${escape(r.id)}" role="button" tabindex="0" aria-label="Rune ${escape(domainName(r.color ?? ''))} · ${r.ready ? 'Ready' : 'Tap'}" title="${escape(domainName(r.color ?? ''))} · ${r.ready ? 'Ready' : 'Tap'} — clic : Tap pour 1 énergie · clic droit : recycler sous le deck de runes pour 1 Power${r.ready ? ' (+1 énergie)' : ''}"><span class="rune-face" aria-hidden="true">${art(r.definitionId, 'rune-art') || `<span class="rune-fallback">${escape(domainName(r.color ?? ''))}</span>`}</span></article>`).join('') : '<span class="empty">Aucune rune en jeu</span>'}</div>
    ${pile('deck', 'Deck', '♜')}${pile('graveyard', 'Défausse', '✧')}
  </div>`;
}

function playerBase(
  state: GameState,
  ownerId: string,
  selected: Selection | null,
  opponent = false,
  destinations: readonly string[] = [],
  moves: readonly PlannedMove[] = [],
  ui: TableUi = {},
  picked: readonly string[] = [],
): string {
  const champion = state.cards.find((c) =>
    state.zones.some(
      (z) =>
        z.id === c.zoneId && z.ownerId === ownerId && z.kind === 'champion',
    ),
  );
  const legend = state.cards.find(
    (c) =>
      c.ownerId === ownerId &&
      state.zones.some((z) => z.id === c.zoneId && z.kind === 'legend'),
  );
  const base = state.zones.find(
    (z) => z.kind === 'base' && z.ownerId === ownerId,
  )!;
  return `<div class="base-row ${opponent ? 'opponent-base' : ''}">${zone(state, base.id, `Base · ${playerName(ownerId)}`, 'Unités en jeu', false, destinations, moves, picked)}<div class="identity-zone">${legend ? art(legend.definitionId, 'legend-art') : ''}<span>Légende<small>${escape(legend ? cardName(legend.definitionId) : '')}</small></span>${!opponent && legend && state.legendDefinitions?.some((d) => d.id === legend.definitionId && d.readyRunesAtEnd) ? `<button type="button" class="auto-toggle ${ui.autoRunes?.[ownerId] ? 'on' : ''}" data-action="toggle-auto-runes" aria-pressed="${!!ui.autoRunes?.[ownerId]}" title="Redresser automatiquement les runes en fin de tour (runes Tap d’abord)">Auto</button>` : ''}</div><div class="chosen-zone">${champion ? (opponent ? `<div class="champion-back"><span>Chosen champion</span><strong>${escape(cardName(champion.definitionId))}</strong>${art(champion.definitionId, 'champion-art')}</div>` : card(champion, selected, true)) : '<p class="empty">Zone champion vide</p>'}</div></div>`;
}

function handFan(
  hand: CardInstance[],
  selected: Selection | null,
  classFor: (c: CardInstance) => string = () => '',
): string {
  const layout = fanLayout(hand.length);
  return `<div class="hand-scroll"><div class="hand fan" style="--cards:${Math.max(1, hand.length)}">${hand.map((c, i) => `<div class="fan-slot" style="--angle:${layout[i]!.angle}deg;--lift:${layout[i]!.lift}px;--card-index:${i}">${card(c, selected, false, classFor(c))}</div>`).join('')}</div></div>`;
}

/** Session de démo et sélection -> HTML échappé. Affiche la main du joueur actif.
 * Les destinations viennent de getLegalActions ; aucune règle de paiement n'est dupliquée ici. */
/** Remise à zéro demandée, en attente de confirmation dans la page (aucun dialogue natif). */
export type PendingReset = 'reset' | 'bo3' | null;

/** État local d'interface, sans effet sur la partie avant validation.
 * endRunes : runes cliquées pour Dark Child (null hors sélection) ;
 * autoRunes : joueurs dont les runes de fin de tour sont choisies automatiquement. */
export interface TableUi {
  /** Cartes marquées pour le mulligan du joueur en cours (0 à 2). */
  mulligan?: readonly string[];
  /** Joueur dont la défausse (publique) est ouverte dans le panneau. */
  graveyard?: string | null;
  endRunes?: readonly string[] | null;
  autoRunes?: Readonly<Record<string, boolean>>;
}

export function renderTable(
  session: Session,
  selected: Selection | null,
  moves: readonly PlannedMove[] = [],
  pendingReset: PendingReset = null,
  ui: TableUi = {},
): string {
  const state = session.state;
  const picked = selected?.targeting ? (selected.picks ?? []) : [];
  // Zones de dépôt et cibles cliquables partagent la surbrillance ; le moteur les fournit.
  const destinations =
    selected &&
    (!moves.length || state.units.some((u) => u.id === selected.cardId))
      ? [
          ...boardOptions(state, selected.cardId).map((a) => a.destinationId!),
          ...(selected.targeting
            ? targetOptions(
                session,
                selected.cardId,
                selected.picks ?? [],
                selected.destinationId,
              ).next
            : []),
        ]
      : [];
  const active = state.activePlayerId;
  const priority =
    state.stack?.priorityPlayerId ??
    state.showdown?.priorityPlayerId ??
    state.priorityPlayerId ??
    active;
  const handOwner = handPlayer(state);
  const mulliganTurn = mulliganPlayer(state);
  const hand = state.cards.filter((c) =>
    state.zones.some(
      (z) => z.id === c.zoneId && z.ownerId === handOwner && z.kind === 'hand',
    ),
  );
  const runeChoice = endTurnRuneChoice(state, active);
  const endRunes = runeChoice ? (ui.endRunes ?? null) : null;
  const canEnd =
    !moves.length &&
    (runeChoice
      ? !endRunes || endRunes.length === runeChoice.count
      : act(state, { type: 'end-turn', playerId: active }).ok);
  const endLabel =
    endRunes && runeChoice
      ? `Valider · ${endRunes.length} / ${runeChoice.count} runes`
      : 'Terminer le tour →';
  return `<header class="topbar"><div class="brand"><span class="brand-icon" aria-hidden="true">◇</span><div><h1>Simulateur TCG</h1><p>La table d’essai</p></div></div><div class="local-tag"><span></span> Local · 2 joueurs</div><button id="undo-action" class="quiet" data-action="undo" title="Annuler la dernière action réussie (10 maximum)" ${moves.length || session.history.length === 0 ? 'disabled' : ''}>↶ Annuler l’action (${session.history.length}/10)</button><button class="quiet" data-action="reset" ${moves.length ? 'disabled' : ''}>Nouvelle partie BO1</button><button class="quiet" data-action="bo3" ${moves.length ? 'disabled' : ''}>Choix BO3 · manche d’essai</button></header>
    <main><section class="play-area"><div class="scoreboard">${state.players.map((p) => `<div class="player ${p.id === active ? 'active' : ''}"><span>${escape(playerName(p.id))}<small>${p.id === active ? 'Tour actif' : 'En attente'}</small></span><strong>${p.score}<small> / ${p.victoryTarget ?? 8}</small></strong></div>`).join('')}</div>
    <div class="turnbar"><div><span class="eyebrow">${state.result ? 'Partie terminée' : mulliganTurn ? 'Préparation · Mulligan' : state.showdown ? 'Main · Showdown en cours' : escape(state.phase === 'main' ? 'Phase principale · Main' : state.phase)}</span><h2>${state.result ? `${escape(playerName(state.result.winnerId))} gagne` : `À ${escape(playerName(active))} de jouer`}</h2></div><span class="priority">Priorité : ${escape(playerName(priority))}</span><button class="primary" data-action="end" ${!canEnd ? 'disabled' : ''}>${escape(endLabel)}</button></div>
    <div class="board">${state.players.map((p) => victoryTrack(p.id, p.score, p.id !== active)).join('')}
      ${state.players
        .filter((p) => p.id !== active)
        .map(
          (p) =>
            `<div class="opponent-hand" aria-label="Main adverse : ${count(state, p.id, 'hand')} cartes">${Array.from({ length: Math.min(count(state, p.id, 'hand'), 12) }, () => '<span class="card-back" aria-hidden="true">◇</span>').join('')}<small>${count(state, p.id, 'hand')} cartes en main</small></div>${resourceRow(state, p.id, true)}${playerBase(state, p.id, selected, true, destinations, moves, {}, picked)}`,
        )
        .join('')}
      <div class="battlefields" style="--fields:${Math.max(1, state.battlefields.length)}">${state.battlefields.map((b, i) => zone(state, b.zoneId, b.definitionId && cardInfo(b.definitionId) ? cardName(b.definitionId) : `Champ de bataille ${i + 1}`, b.controllerId ? `Contrôlé par ${playerName(b.controllerId)}` : 'Neutre', true, destinations, moves, picked)).join('')}</div>
      ${playerBase(state, active, selected, false, destinations, moves, ui, picked)}
      ${resourceRow(state, active, false, endRunes)}
    </div>
    <div class="reserve"><span>${escape(playerName(active))} · Réserve flottante</span><span><b>${state.resources[active]?.energy ?? 0}</b> énergie · <b>${escape(powerText(state.resources[active]?.power ?? {}))}</b> Power</span></div>
    <section class="hand-section"><header><h2>Main de ${escape(playerName(handOwner))}</h2><span>${hand.length} cartes · sélectionner pour jouer</span></header>${handFan(hand, selected, (c) => (mulliganTurn && ui.mulligan?.includes(c.id) ? 'mulligan-marked' : state.pendingDiscard?.playerId === handOwner ? 'discard-choice' : ''))}</section></section>
    <aside><section class="action-panel">${session.error ? `<p role="alert" class="error">${escape(session.error)}</p>` : ''}${pendingReset ? resetPanel(pendingReset) : ui.graveyard ? graveyardPanel(state, ui.graveyard) : mulliganTurn ? mulliganPanel(mulliganTurn, ui.mulligan ?? []) : endRunes && runeChoice ? endRunesPanel(endRunes.length, runeChoice.count) : moves.length ? movementPanel(session, moves) : paymentPanel(session, selected)}</section><section class="journal"><header><h2>Journal de partie</h2><span>${session.log.length}</span></header><ol>${session.log
      .slice()
      .reverse()
      .map((line) => `<li>${escape(line)}</li>`)
      .join(
        '',
      )}</ol></section></aside></main><footer>Prototype local · Préparation fixe, sans sauvegarde · Déplacements base ↔ champ · Choix et combats pilotés par le moteur</footer>`;
}

function actionLabel(
  session: Session,
  action: import('../../../packages/game-engine/src/index.js').GameAction,
): string {
  const state = session.state;
  const unit = (id: string) => {
    const u = state.units.find((u) => u.id === id);
    return u
      ? `${cardName(u.definitionId)} (${playerName(u.ownerId)}, ${u.id})`
      : id;
  };
  const target = (id: string): string => {
    const u = state.units.find((u) => u.id === id);
    if (u) return unit(id);
    const c = state.cards.find((c) => c.id === id);
    if (c) return cardName(c.definitionId) + ' (' + id + ')';
    const z = state.zones.find((z) => z.id === id);
    if (z)
      return z.kind === 'base'
        ? 'Base de ' + playerName(z.ownerId!)
        : 'Champ ' + (state.battlefields.findIndex((f) => f.zoneId === id) + 1);
    return state.players.some((p) => p.id === id) ? playerName(id) : id;
  };
  const prefix = playerName(action.playerId) + ' · ';
  switch (action.type) {
    case 'cast-spell': {
      const parts: string[] = [];
      if (action.selectedUnitIds)
        parts.push(
          action.selectedUnitIds.length
            ? action.selectedUnitIds.map(target).join(' + ')
            : 'Aucune unité',
        );
      else if (!state.players.some((p) => p.id === action.targetId))
        parts.push(target(action.targetId));
      if (action.secondaryTargetId)
        parts.push('contre ' + target(action.secondaryTargetId));
      if (action.destinationId)
        parts.push('vers ' + target(action.destinationId));
      if (action.tokenDestinations)
        parts.push(
          'Recrues : ' +
            action.tokenDestinations
              .map((id, i) => `${i + 1} → ${target(id)}`)
              .join(' ; '),
        );
      if (action.exhaustUnitId)
        parts.push('Épuiser ' + target(action.exhaustUnitId));
      return 'Lancer' + (parts.length ? ' · ' + parts.join(' · ') : ' le sort');
    }
    case 'play-unit':
      return (
        'Jouer → ' +
        target(
          action.destinationId ??
            state.zones.find(
              (z) => z.kind === 'base' && z.ownerId === action.playerId,
            )!.id,
        ) +
        (action.onPlayTargetId
          ? ' · Cible : ' + target(action.onPlayTargetId)
          : '') +
        (action.accelerate ? ' · Accelerate (arrive Ready)' : '') +
        (action.returnSpellId
          ? ' · Récupérer : ' + target(action.returnSpellId)
          : '')
      );
    case 'play-gear':
      return 'Poser en base';
    case 'equip-gear':
      return 'Équiper sur ' + target(action.unitId);
    case 'activate-spell-energy':
      return (
        'Épuiser ' +
        target(action.unitId) +
        ' pour produire de l’énergie de sort'
      );
    case 'choose-discard':
      return prefix + 'Défausser ' + target(action.cardId);
    case 'choose-vision':
      return (
        prefix +
        (action.recycle
          ? 'Recycler sous le deck'
          : 'Conserver au-dessus du deck')
      );
    case 'choose-attack-targets':
      return (
        prefix +
        action.effects
          .map(
            (e) =>
              target(e.sourceId) +
              (e.targetId ? ' → ' + target(e.targetId) : ' · sans cible'),
          )
          .join(' ; ')
      );
    case 'queue-death-effects':
      return (
        prefix +
        action.effects
          .map((e) =>
            state.pendingDeaths?.triggers.find((t) => t.sourceId === e.sourceId)
              ?.effect.type === 'summon-token'
              ? target(e.sourceId) + ' → ' + target(e.destinationId)
              : target(e.sourceId),
          )
          .join(' puis ')
      );
    case 'choose-battlefield': {
      const setup = state.setup;
      const field =
        setup?.stage === 'choose-battlefield'
          ? setup.options[action.playerId]?.find(
              (c) => c.id === action.battlefieldId,
            )
          : undefined;
      return prefix + cardName(field?.definitionId ?? action.battlefieldId);
    }
    case 'choose-defense-shield':
      return prefix + 'Shield 2 → ' + unit(action.targetId);
    case 'choose-hold-channel':
      return (
        prefix +
        (action.accept ? 'Ajouter une rune Tap' : 'Ne pas ajouter de rune')
      );
    case 'assign-damage':
      return (
        prefix +
        'Répartir : ' +
        action.allocations
          .map((a) => a.amount + ' → ' + unit(a.targetId))
          .join(' ; ')
      );
    case 'end-turn':
      return (
        prefix +
        'Redresser ' +
        (action.readyRuneIds ?? [])
          .map((id) => {
            const r = state.cards.find((c) => c.id === id);
            return domainName(r?.color ?? '') + ' (' + id.slice(-1) + ')';
          })
          .join(' + ') +
        ' puis terminer le tour'
      );
    case 'pass':
      return prefix + 'Passer la priorité';
    default:
      return prefix + action.type;
  }
}

/** Brouillon local -> récapitulatif explicite ; les cartes restent à leur position réelle jusqu'à validation. */
function movementPanel(
  session: Session,
  moves: readonly PlannedMove[],
): string {
  return `<div class="eyebrow">Déplacements préparés</div><h3>${moves.length} unité(s)</h3><p class="help">Ajoute d’autres unités en les glissant vers leur destination. Aucun déplacement ni combat n’a encore commencé.</p><ul>${moves
    .map((m) => {
      const unit = session.state.units.find((u) => u.id === m.unitId);
      const field = session.state.battlefields.findIndex(
        (f) => f.zoneId === m.destinationId,
      );
      return `<li>${escape(unit ? cardName(unit.definitionId) : m.unitId)} → ${field >= 0 ? `Champ de bataille ${field + 1}` : 'Base'}</li>`;
    })
    .join(
      '',
    )}</ul><button class="primary" data-action="confirm-moves">Valider les déplacements (${moves.length})</button><button class="quiet" data-action="cancel-moves">Annuler les déplacements</button>`;
}

/** Projection visuelle seulement : position/Tap et Might passive, sans déclencher d'effets. */
function movePreviews(
  state: GameState,
  zoneId: string,
  moves: readonly PlannedMove[],
): string {
  const projected = {
    ...state,
    units: state.units.map((u) => {
      const move = moves.find((m) => m.unitId === u.id);
      return move ? { ...u, zoneId: move.destinationId, ready: false } : u;
    }),
  };
  return moves
    .filter((m) => m.destinationId === zoneId)
    .map((m) => {
      const u = projected.units.find((u) => u.id === m.unitId);
      if (!u) return '';
      return `<div class="unit-slot" data-preview="${escape(u.id)}" aria-label="Aperçu : ${escape(cardName(u.definitionId))} Tap"><div class="unit-card tapped move-preview"><span class="unit-face">${art(u.definitionId, 'unit-art') || `<span class="unit-fallback">${escape(cardName(u.definitionId))}</span>`}</span><span class="unit-might">${effectiveMight(u, projected)}</span></div></div>`;
    })
    .join('');
}
function victoryTrack(
  playerId: string,
  score: number,
  opponent: boolean,
): string {
  return `<div class="victory-track ${opponent ? 'opponent' : 'active'}" aria-label="${escape(playerName(playerId))} : ${score} points sur 8">${Array.from({ length: 8 }, (_, i) => `<span class="victory-crystal ${score > i ? 'earned' : ''}" title="${i + 1} point(s)"><b>${i + 1}</b></span>`).join('')}</div>`;
}

/** Carte/unité sélectionnée -> liste de choix complets issus du moteur, jamais de cible implicite.
 * Les index réfèrent à cardActions ; seuls les choix d'une destination retenue sont affichés. */
function selectedCardPanel(session: Session, selection: Selection): string {
  const state = session.state;
  const card =
    state.cards.find((c) => c.id === selection.cardId) ??
    state.units.find((c) => c.id === selection.cardId) ??
    state.gears?.find((g) => g.id === selection.cardId);
  if (!card)
    return '<p>Carte indisponible.</p><button data-action="cancel">Retour</button>';
  const all = cardActions(session, card.id).map((action, index) => ({
    action,
    index,
  }));
  const options = targetOptions(
    session,
    card.id,
    selection.picks ?? [],
    selection.destinationId,
  );
  const keys = (list: readonly GameAction[]) =>
    new Set(list.map((action) => JSON.stringify(action)));
  const compatible = keys(options.actions);
  const complete = keys(options.complete);
  const button = ({ action, index }: { action: GameAction; index: number }) =>
    `<button class="quiet" data-card-action="${index}">${escape(actionLabel(session, action))}</button>`;
  const info = cardInfo(card.definitionId);
  const spell = state.spellDefinitions?.find((d) => d.id === card.definitionId);
  const header = `<div class="eyebrow">${spell ? { normal: 'Sort normal', action: 'Sort Action', reaction: 'Sort Réaction' }[spell.timing] : 'Carte sélectionnée'}</div><h3>${escape(cardName(card.definitionId))}</h3>${art(card.definitionId, 'card-preview')}${info?.cost ? `<p class="cost-summary">Coût imprimé : ${info.cost.energy} énergie · ${escape(powerText(info.cost.power))} Power${info.cost.powerChoice ? ` + ${info.cost.powerChoiceAmount ?? 1} ${escape(info.cost.powerChoice.map(domainName).join(' / '))}` : ''}</p>` : ''}<p class="help">${escape(info?.text ?? '')}</p>`;
  if (!all.length)
    return `${header}<p class="help">Aucun choix légal : vérifie les cibles, les ressources et la priorité.</p><button class="quiet" data-action="cancel">Retour</button>`;
  if (selection.targeting) {
    const names = (selection.picks ?? []).map((id) => {
      const unit = state.units.find((u) => u.id === id);
      if (unit) return cardName(unit.definitionId);
      const field = state.battlefields.findIndex((b) => b.zoneId === id);
      return field >= 0 ? `Champ ${field + 1}` : id;
    });
    const ready = all.filter(({ action }) =>
      complete.has(JSON.stringify(action)),
    );
    const validate =
      ready.length > 1
        ? `<p class="help">Plusieurs options pour ces cibles :</p><div class="choice-list">${ready.map(button).join('')}</div>`
        : `<button class="primary" data-action="confirm-targets" ${ready.length ? '' : 'disabled'}>Valider</button>`;
    return `${header}<div class="eyebrow">Ciblage</div><p class="help">Clique les cibles en surbrillance ; un second clic retire une cible. Le paiement se fait à la validation.</p><p class="help">Cibles : ${names.length ? escape(names.join(' → ')) : 'aucune'}</p><div class="choice-list">${validate}<button class="quiet" data-action="cancel">Annuler</button></div>`;
  }
  const choices = all.filter(({ action }) =>
    compatible.has(JSON.stringify(action)),
  );
  if (spell)
    return `${header}<div class="choice-list"><button class="primary" data-action="start-targeting">Lancer</button><button class="quiet" data-action="cancel">Retour</button></div><details class="all-options"><summary>Toutes les options (${choices.length})</summary><div class="choice-list">${choices.map(button).join('')}</div></details>`;
  return `${header}<p class="help">Choisis la mise en jeu ou la capacité ci-dessous. Le paiement est automatique.</p><div class="choice-list">${choices.map(button).join('')}</div><button class="quiet" data-action="cancel">Retour</button>`;
}

/** Confirmation de remise à zéro ; la partie n'est effacée qu'après « Recommencer ». */
function resetPanel(kind: Exclude<PendingReset, null>): string {
  const label =
    kind === 'bo3' ? 'Choix BO3 · manche d’essai BO3' : 'Nouvelle partie BO1';
  return `<section class="reset-confirm" role="alertdialog" aria-labelledby="reset-title"><div class="eyebrow">${escape(label)}</div><h3 id="reset-title">Recommencer la partie de test ?</h3><p class="help">La partie actuelle sera effacée, ainsi que l’historique d’annulation.</p><div class="choice-list"><button class="primary" data-action="confirm-reset">Recommencer</button><button class="quiet" data-action="cancel-reset">Continuer la partie</button></div></section>`;
}

/** Sélection des runes de fin de tour : les runes se cliquent sur le plateau. */
function endRunesPanel(chosen: number, count: number): string {
  return `<div class="eyebrow">Fin de tour · Dark Child</div><h3>Redresser ${count} rune(s)</h3><p class="help">Clique les runes à redresser sur ta rangée (${chosen} / ${count}), puis valide avec le bouton de fin de tour.</p><div class="choice-list"><button class="primary" data-action="end" ${chosen === count ? '' : 'disabled'}>Valider la fin de tour</button><button class="quiet" data-action="cancel-end">Annuler</button></div>`;
}

/** Défausse publique d'un joueur, la carte la plus récente en premier. Lecture seule. */
function graveyardPanel(state: GameState, ownerId: string): string {
  const cards = state.cards
    .filter((c) =>
      state.zones.some(
        (z) =>
          z.id === c.zoneId && z.kind === 'graveyard' && z.ownerId === ownerId,
      ),
    )
    .reverse();
  return `<div class="eyebrow">Défausse</div><h3>Défausse de ${escape(playerName(ownerId))} · ${cards.length} carte${cards.length > 1 ? 's' : ''}</h3>${cards.length ? `<ol class="graveyard-list">${cards.map((c) => `<li title="${escape(cardInfo(c.definitionId)?.text ?? '')}">${art(c.definitionId, 'graveyard-art')}<span>${escape(cardName(c.definitionId))}</span></li>`).join('')}</ol>` : '<p class="help">Aucune carte dans cette défausse.</p>'}<button class="quiet" data-action="close-graveyard">Fermer</button>`;
}

/** Mulligan du joueur en cours : les cartes se marquent dans la main (2 au plus). */
function mulliganPanel(playerId: string, marked: readonly string[]): string {
  const label = marked.length
    ? `Remplacer ${marked.length} carte${marked.length > 1 ? 's' : ''}`
    : 'Garder ma main';
  return `<div class="eyebrow">Préparation</div><h3>Mulligan · ${escape(playerName(playerId))}</h3><p class="help">Clique jusqu’à 2 cartes de ta main à remplacer (${marked.length} / 2). Elles vont sous ton deck sans mélange, puis tu en pioches autant.</p><div class="choice-list"><button class="primary" data-action="confirm-mulligan">${label}</button></div>`;
}
