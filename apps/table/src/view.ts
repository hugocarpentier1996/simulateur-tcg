import {
  act,
  effectiveMight,
  type CardInstance,
  type GameState,
} from '../../../packages/game-engine/src/index.js';
import {
  cardName,
  demoUnits,
  playerName,
  placementOptions,
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

function card(
  card: CardInstance,
  selected: Selection | null,
  champion = false,
): string {
  const def = demoUnits.find((d) => d.id === card.definitionId)!;
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
    <div class="units">${units.length ? units.map((u) => `<article class="unit ${u.ready ? 'ready' : 'tapped'}"><span class="unit-might">${effectiveMight(u, state)}</span><div><strong>${escape(cardName(u.definitionId).replace(' de test', ''))}</strong><small>${escape(playerName(u.ownerId))} · ${u.ready ? 'Ready' : 'Tap'} · ${u.damage} dégât(s)</small></div></article>`).join('') : `<p class="empty">${battlefield ? 'Aucune unité sur ce champ' : 'Aucune unité en base'}</p>`}</div>${destinations.includes(zoneId) ? '<button type="button" class="place-here">Poser ici · paiement automatique</button>' : ''}</section>`;
}

function paymentPanel(session: Session, selection: Selection | null): string {
  if (!selection)
    return '<div class="selection-empty"><span aria-hidden="true">↙</span><h3>Pose une carte pour jouer</h3><p>Glisse une unité sur une zone éclairée. Son coût est payé automatiquement.</p><p>Tu peux aussi cliquer la carte, puis sa destination.</p></div>';
  const instance = session.state.cards.find((c) => c.id === selection.cardId)!;
  const def = demoUnits.find((d) => d.id === instance.definitionId)!;
  const options = placementOptions(session.state, selection.cardId);
  return `<div class="eyebrow">Carte sélectionnée</div><h3>${escape(def.name)}</h3><p class="cost-summary">${def.cost.energy} énergie + ${escape(powerText(def.cost.power))} Power</p><p class="payment-status" role="status">${options.length ? 'Pose la carte sur une zone éclairée. Le paiement sera effectué automatiquement.' : 'Cette carte n’est pas jouable maintenant : ressources insuffisantes ou fenêtre fermée.'}</p><p class="help">Les runes nécessaires seront épuisées pour l’Énergie et recyclées pour le Power.</p><button class="quiet" type="button" data-action="cancel">Annuler la sélection</button>`;
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
    <div class="rune-cards">${runes.length ? runes.map((r) => `<article class="rune-card ${escape(r.color ?? '')} ${r.ready ? '' : 'tapped'}"><span aria-hidden="true">${r.color === 'rouge' ? '◆' : '◈'}</span><strong>${escape(r.color ?? '')}</strong><small>${r.ready ? 'Ready' : 'Tap'}</small></article>`).join('') : '<span class="empty">Aucune rune en jeu</span>'}</div>
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
  const base = state.zones.find(
    (z) => z.kind === 'base' && z.ownerId === ownerId,
  )!;
  return `<div class="base-row ${opponent ? 'opponent-base' : ''}"><div class="identity-zone"><span class="legend-mark" aria-hidden="true">♔</span><span>Légende<small>Rouge · Bleu</small></span></div>${zone(state, base.id, `Base · ${playerName(ownerId)}`, 'Unités en jeu', false, destinations)}<div class="chosen-zone">${champion ? (opponent ? `<div class="champion-back"><span>Chosen champion</span><strong>${escape(cardName(champion.definitionId))}</strong><b>♜</b></div>` : card(champion, selected, true)) : '<p class="empty">Zone champion vide</p>'}</div></div>`;
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
): string {
  const state = session.state;
  const destinations = selected
    ? placementOptions(state, selected.cardId).map((a) => a.destinationId!)
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
  const canEnd = act(state, { type: 'end-turn', playerId: active }).ok;
  return `<header class="topbar"><div class="brand"><span class="brand-icon" aria-hidden="true">◇</span><div><h1>Simulateur TCG</h1><p>La table d’essai</p></div></div><div class="local-tag"><span></span> Local · 2 joueurs</div><button class="quiet" data-action="reset">Nouvelle partie</button></header>
    <main><section class="play-area"><div class="scoreboard">${state.players.map((p) => `<div class="player ${p.id === active ? 'active' : ''}"><span>${escape(playerName(p.id))}<small>${p.id === active ? 'Tour actif' : 'En attente'}</small></span><strong>${p.score}<small> / ${p.victoryTarget ?? 8}</small></strong></div>`).join('')}</div>
    <div class="turnbar"><div><span class="eyebrow">${state.result ? 'Partie terminée' : 'Phase principale · Main'}</span><h2>${state.result ? `${escape(playerName(state.result.winnerId))} gagne` : `À ${escape(playerName(active))} de jouer`}</h2></div><span class="priority">Priorité : ${escape(playerName(priority))}</span><button class="primary" data-action="end" ${!canEnd ? 'disabled' : ''}>Terminer le tour →</button></div>
    <div class="board">
      ${state.players
        .filter((p) => p.id !== active)
        .map(
          (p) =>
            `<div class="opponent-hand" aria-label="Main adverse : ${count(state, p.id, 'hand')} cartes">${Array.from({ length: Math.min(count(state, p.id, 'hand'), 12) }, () => '<span class="card-back" aria-hidden="true">◇</span>').join('')}<small>${count(state, p.id, 'hand')} cartes en main</small></div>${resourceRow(state, p.id, true)}${playerBase(state, p.id, selected, true)}`,
        )
        .join('')}
      <div class="battlefields" style="--fields:${Math.max(1, state.battlefields.length)}">${state.battlefields.map((b, i) => zone(state, b.zoneId, `Champ de bataille ${i + 1}`, b.controllerId ? `Contrôlé par ${playerName(b.controllerId)}` : 'Neutre', true, destinations)).join('')}</div>
      ${playerBase(state, active, selected, false, destinations)}
      ${resourceRow(state, active)}
    </div>
    <div class="reserve"><span>${escape(playerName(active))} · Réserve flottante</span><span><b>${state.resources[active]?.energy ?? 0}</b> énergie · <b>${escape(powerText(state.resources[active]?.power ?? {}))}</b> Power</span></div>
    <section class="hand-section"><header><h2>Main de ${escape(playerName(active))}</h2><span>${hand.length} cartes · sélectionner pour jouer</span></header>${handFan(hand, selected)}</section></section>
    <aside><section class="action-panel">${session.error ? `<p role="alert" class="error">${escape(session.error)}</p>` : ''}${paymentPanel(session, selected)}</section><section class="journal"><header><h2>Journal de partie</h2><span>${session.log.length}</span></header><ol>${session.log
      .slice()
      .reverse()
      .map((line) => `<li>${escape(line)}</li>`)
      .join(
        '',
      )}</ol></section></aside></main><footer>Prototype local · Préparation fixe, sans sauvegarde · Déplacements et combats interactifs à venir</footer>`;
}
