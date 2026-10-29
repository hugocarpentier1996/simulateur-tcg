import type { PlannedMove } from './move-plan.js';
import { cardInfo } from './catalogue.js';
import {
  act,
  effectiveMight,
  type CardInstance,
  type GameState,
} from '../../../packages/game-engine/src/index.js';
import {
  cardName,
  tableActions,
  playerName,
  boardOptions,
  type Session,
} from './session.js';
import { fanLayout } from './fan.js';

/** Sélection locale, sans conséquence sur la partie avant validation par act. */
export interface Selection {
  cardId: string;
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
    .map(([color, n]) => `${n} ${color}`)
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
): string {
  const def = {
    name: card.definitionId,
    might: 0,
    cost: { energy: 0, power: {} },
    ...cardInfo(card.definitionId),
  };
  if (def.imageLocal)
    return `<button type="button" class="card illustrated-card ${selected?.cardId === card.id ? 'selected' : ''}" id="card-${escape(card.id)}" data-card="${escape(card.id)}" aria-pressed="${selected?.cardId === card.id}" title="${escape(cardName(card.definitionId))} · ${escape(def.tags?.join(' · ') ?? '')}">${art(card.definitionId, 'card-art')}<span class="sr-only">${champion ? 'Chosen champion · ' : ''}${escape(cardName(card.definitionId))}</span></button>`;
  return `<button type="button" class="card ${selected?.cardId === card.id ? 'selected' : ''}" id="card-${escape(card.id)}" draggable="false" data-card="${escape(card.id)}" aria-pressed="${selected?.cardId === card.id}">
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
): string {
  const units = state.units.filter((u) => u.zoneId === zoneId);
  return `<section data-zone="${escape(zoneId)}" class="zone ${destinations.includes(zoneId) ? 'drop-target' : ''} ${battlefield ? 'battlefield' : 'base'}"><header><h3>${escape(title)}</h3><span>${escape(subtitle)}</span></header>
    ${battlefield ? art(state.battlefields.find((b) => b.zoneId === zoneId)?.definitionId ?? '', 'field-art') : ''}
    <div class="units">${
      units.length
        ? units
            .map((u) => {
              const label = `${cardName(u.definitionId)} · ${playerName(u.ownerId)} · ${u.ready ? 'Ready' : 'Tap'} · Might ${effectiveMight(u, state)} · ${u.damage} dégât(s)`;
              return `<div class="unit-slot"><button type="button" id="unit-${escape(u.id)}" data-card="${escape(u.id)}" class="unit-card ${u.ready ? 'ready' : 'tapped'}" aria-label="${escape(label)}" title="${escape(label)}"><span class="unit-face">${art(u.definitionId, 'unit-art') || `<span class="unit-fallback">${escape(cardName(u.definitionId))}</span>`}</span><span class="unit-might">${effectiveMight(u, state)}</span></button></div>`;
            })
            .join('')
        : `<p class="empty">${battlefield ? 'Aucune unité sur ce champ' : 'Aucune unité en base'}</p>`
    }</div>${destinations.includes(zoneId) ? '<button type="button" class="place-here">Choisir cette destination</button>' : ''}</section>`;
}

function paymentPanel(session: Session, selection: Selection | null): string {
  const choices = tableActions(session);
  const state = session.state;
  if (
    state.setup ||
    state.stack ||
    state.pendingDefenseShield ||
    state.pendingHoldChannel ||
    state.showdown?.kind === 'combat'
  ) {
    const heading = state.pendingDefenseShield
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
              : 'Combat Showdown';
    return `<div class="eyebrow">Choix du moteur</div><h3>${heading}</h3><p class="help">Les boutons proposent uniquement les actions actuellement autorisées.</p><div class="choice-list">${choices.map((a, i) => `<button class="quiet" data-choice="${i}">${escape(actionLabel(session, a))}</button>`).join('')}</div>`;
  }
  const showdown = session.state.showdown;
  if (showdown?.kind === 'open')
    return `<div class="eyebrow">Open Showdown</div><h3>Champ de bataille ${session.state.battlefields.findIndex((b) => b.zoneId === showdown.battlefieldId) + 1}</h3><p class="help">Priorité à ${escape(playerName(showdown.priorityPlayerId))}. Le contrôle et le point de conquête seront attribués après les passes des deux joueurs.</p><p>${showdown.consecutivePasses} / ${showdown.participants.length} passes</p><button class="primary" data-action="pass">Passer · ${escape(playerName(showdown.priorityPlayerId))}</button>`;
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
): string {
  const runes = state.cards.filter((c) =>
    state.zones.some(
      (z) => z.id === c.zoneId && z.kind === 'runes' && z.ownerId === ownerId,
    ),
  );
  const pile = (kind: string, label: string, symbol: string) =>
    `<div class="pile ${kind}" aria-label="${escape(label)} de ${escape(playerName(ownerId))}"><div class="pile-face"><span aria-hidden="true">${symbol}</span><b>${count(state, ownerId, kind)}</b></div><small>${label}</small></div>`;
  return `<div class="resource-row ${opponent ? 'opponent-resources' : ''}" aria-label="Ressources de ${escape(playerName(ownerId))}">
    ${pile('rune-pile', 'Deck de runes', '◇')}
    <div class="rune-cards">${runes.length ? runes.map((r) => `<article class="rune-card ${escape(r.color ?? '')} ${r.ready ? '' : 'tapped'}"><span aria-hidden="true">${art(r.definitionId, 'rune-art') || (r.color === 'rouge' ? '◆' : '◈')}</span><strong>${escape(r.color ?? '')}</strong><small>${r.ready ? 'Ready' : 'Tap'}</small></article>`).join('') : '<span class="empty">Aucune rune en jeu</span>'}</div>
    ${pile('deck', 'Deck', '♜')}${pile('graveyard', 'Défausse', '✧')}
  </div>`;
}

function playerBase(
  state: GameState,
  ownerId: string,
  selected: Selection | null,
  opponent = false,
  destinations: readonly string[] = [],
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
  return `<div class="base-row ${opponent ? 'opponent-base' : ''}">${zone(state, base.id, `Base · ${playerName(ownerId)}`, 'Unités en jeu', false, destinations)}<div class="identity-zone">${legend ? art(legend.definitionId, 'legend-art') : ''}<span>Légende<small>${escape(legend ? cardName(legend.definitionId) : '')}</small></span></div><div class="chosen-zone">${champion ? (opponent ? `<div class="champion-back"><span>Chosen champion</span><strong>${escape(cardName(champion.definitionId))}</strong>${art(champion.definitionId, 'champion-art')}</div>` : card(champion, selected, true)) : '<p class="empty">Zone champion vide</p>'}</div></div>`;
}

function handFan(hand: CardInstance[], selected: Selection | null): string {
  const layout = fanLayout(hand.length);
  return `<div class="hand-scroll"><div class="hand fan" style="--cards:${Math.max(1, hand.length)}">${hand.map((c, i) => `<div class="fan-slot" style="--angle:${layout[i]!.angle}deg;--lift:${layout[i]!.lift}px;--card-index:${i}">${card(c, selected)}</div>`).join('')}</div></div>`;
}

/** Session de démo et sélection -> HTML échappé. Affiche la main du joueur actif.
 * Les destinations viennent de getLegalActions ; aucune règle de paiement n'est dupliquée ici. */
export function renderTable(
  session: Session,
  selected: Selection | null,
  moves: readonly PlannedMove[] = [],
): string {
  const state = session.state;
  const destinations =
    selected &&
    (!moves.length || state.units.some((u) => u.id === selected.cardId))
      ? boardOptions(state, selected.cardId).map((a) => a.destinationId!)
      : [];
  const active = state.activePlayerId;
  const priority =
    state.stack?.priorityPlayerId ??
    state.showdown?.priorityPlayerId ??
    state.priorityPlayerId ??
    active;
  const hand = state.cards.filter((c) =>
    state.zones.some(
      (z) => z.id === c.zoneId && z.ownerId === active && z.kind === 'hand',
    ),
  );
  const canEnd =
    !moves.length && act(state, { type: 'end-turn', playerId: active }).ok;
  return `<header class="topbar"><div class="brand"><span class="brand-icon" aria-hidden="true">◇</span><div><h1>Simulateur TCG</h1><p>La table d’essai</p></div></div><div class="local-tag"><span></span> Local · 2 joueurs</div><button id="undo-action" class="quiet" data-action="undo" title="Annuler la dernière action réussie (10 maximum)" ${moves.length || session.history.length === 0 ? 'disabled' : ''}>↶ Annuler l’action (${session.history.length}/10)</button><button class="quiet" data-action="reset" ${moves.length ? 'disabled' : ''}>Nouvelle partie BO1</button><button class="quiet" data-action="bo3" ${moves.length ? 'disabled' : ''}>Choix BO3 · manche d’essai</button></header>
    <main><section class="play-area"><div class="scoreboard">${state.players.map((p) => `<div class="player ${p.id === active ? 'active' : ''}"><span>${escape(playerName(p.id))}<small>${p.id === active ? 'Tour actif' : 'En attente'}</small></span><strong>${p.score}<small> / ${p.victoryTarget ?? 8}</small></strong></div>`).join('')}</div>
    <div class="turnbar"><div><span class="eyebrow">${state.result ? 'Partie terminée' : state.showdown ? 'Main · Showdown en cours' : escape(state.phase === 'main' ? 'Phase principale · Main' : state.phase)}</span><h2>${state.result ? `${escape(playerName(state.result.winnerId))} gagne` : `À ${escape(playerName(active))} de jouer`}</h2></div><span class="priority">Priorité : ${escape(playerName(priority))}</span><button class="primary" data-action="end" ${!canEnd ? 'disabled' : ''}>Terminer le tour →</button></div>
    <div class="board">
      ${state.players
        .filter((p) => p.id !== active)
        .map(
          (p) =>
            `<div class="opponent-hand" aria-label="Main adverse : ${count(state, p.id, 'hand')} cartes">${Array.from({ length: Math.min(count(state, p.id, 'hand'), 12) }, () => '<span class="card-back" aria-hidden="true">◇</span>').join('')}<small>${count(state, p.id, 'hand')} cartes en main</small></div>${resourceRow(state, p.id, true)}${playerBase(state, p.id, selected, true)}`,
        )
        .join('')}
      <div class="battlefields" style="--fields:${Math.max(1, state.battlefields.length)}">${state.battlefields.map((b, i) => zone(state, b.zoneId, b.definitionId && cardInfo(b.definitionId) ? cardName(b.definitionId) : `Champ de bataille ${i + 1}`, b.controllerId ? `Contrôlé par ${playerName(b.controllerId)}` : 'Neutre', true, destinations)).join('')}</div>
      ${playerBase(state, active, selected, false, destinations)}
      ${resourceRow(state, active)}
    </div>
    <div class="reserve"><span>${escape(playerName(active))} · Réserve flottante</span><span><b>${state.resources[active]?.energy ?? 0}</b> énergie · <b>${escape(powerText(state.resources[active]?.power ?? {}))}</b> Power</span></div>
    <section class="hand-section"><header><h2>Main de ${escape(playerName(active))}</h2><span>${hand.length} cartes · sélectionner pour jouer</span></header>${handFan(hand, selected)}</section></section>
    <aside><section class="action-panel">${session.error ? `<p role="alert" class="error">${escape(session.error)}</p>` : ''}${moves.length ? movementPanel(session, moves) : paymentPanel(session, selected)}</section><section class="journal"><header><h2>Journal de partie</h2><span>${session.log.length}</span></header><ol>${session.log
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
  const prefix = playerName(action.playerId) + ' · ';
  switch (action.type) {
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
