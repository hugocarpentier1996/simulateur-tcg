import type { PlayEffectEntry } from './effects/play-effect.js';
import type { ModeChoiceEntry } from './effects/mode-choice.js';
import {
  spendBuffAbility,
  trashRecycleAbility,
} from './actions/spend-buff-ability.js';
import {
  hideCard,
  playableFacedown,
  trashLostFacedown,
} from './effects/hidden.js';
import { buffChoiceEntry, chooseMode } from './effects/mode-choice.js';
import { spellChosenUnits } from './cost/deflect.js';
import { choosePick } from './effects/pick.js';
import { activeLegends } from './effects/legends.js';
import { isStunned } from './effects/modifiers.js';
import { battlefieldDefinition } from './effects/battlefield.js';
import {
  chooseDefenseShield,
  queueDefenseShield,
  queueDefendRetreat,
} from './effects/defense-shield.js';
import { chooseHoldChannel } from './effects/hold-channel.js';
import { resumeTurn } from './turn/progression.js';
import { chooseAttackTargets } from './effects/attack-targets.js';
import { chooseVision } from './effects/vision.js';
import { queueAttackEffects } from './effects/attack-triggers.js';
import { chooseDiscard } from './actions/choose-discard.js';
import { queueMovementEffects } from './effects/movement-triggers.js';
import { startNextTurn } from './turn/progression.js';
import { queueConquestLegends } from './effects/conquest-legends.js';
import type {
  GameState,
  GameAction,
  ActionResult,
  GameEvent,
} from './types.js';
import { activateSpellEnergy } from './actions/activate-spell-energy.js';
import { tapRune, recycleRune } from './actions/manual-runes.js';
import { activateGear } from './actions/activate-gear.js';
import { moveGroup } from './actions/move-group.js';
import { moveUnit } from './actions/move.js';
import { passPriority } from './actions/pass.js';
import { endTurn } from './actions/end-turn.js';
import { playUnit } from './actions/play-unit.js';
import { assignDamage } from './actions/assign-damage.js';
import { castSpell } from './actions/cast-spell.js';
import { passStack } from './actions/pass-stack.js';
import { afterEffects } from './showdown/after-effects.js';
import { chooseFirstPlayer } from './setup/choose-first.js';
import { mulligan } from './setup/mulligan.js';
import { chooseBattlefield } from './setup/battlefields.js';
import { playGear } from './actions/play-gear.js';
import { equipGear } from './actions/equip-gear.js';
import { syncAttachments } from './effects/attachments.js';
import { queueDeathEffects } from './effects/death.js';
import { settleLethalUnits } from './effects/lethal-units.js';

/**
 * Point d'entrée du moteur : état courant + intention -> résultat de l'action.
 *
 * @param state État cohérent de la partie avant l'action, non modifié par cet appel.
 * @param action Intention typée à vérifier puis appliquer.
 * @returns Refus explicite, ou nouvel état accompagné de ses événements :
 * - move accepté : unité déplacée/Tap, Showdown ouvert si nécessaire, événements
 *   `unit-moved` puis `showdown-opened`.
 * - première passe : priorité au participant suivant, événement `priority-passed`.
 * - dernière passe en Open : Showdown fermé, contrôle attribué à l'initiateur, événements
 *   `priority-passed`, `battlefield-conquered`, puis `point-scored` si le champ
 *   n'a pas déjà donné de point à ce joueur pendant ce tour.
 * - end-turn : fin du tour puis étapes automatiques jusqu'à la Main du suivant ;
 *   événements de phase, de ressources, de tenue, de runes et de pioche ordonnés.
 * - play-unit : paiement complet et unité Tap en base, ou refus sans changement.
 * - assign-damage : choix enregistré, puis résolution simultanée après les deux choix.
 *
 * Même état + même action = même résultat, sans effet réseau ni horloge implicite.
 * Les parties inchangées de l'état peuvent partager leurs objets avec l'entrée :
 * traiter les états comme des instantanés et éviter de les modifier après un appel.
 * Un gain autorisé atteignant le seuil termine la partie ; une conquête finale
 * inéligible est remplacée par une pioche, avec le champ inscrit comme scoré.
 */
export function act(state: GameState, action: GameAction): ActionResult {
  if (action.type === 'set-preference') return setPreference(state, action);
  const result = actOnce(state, action);
  return result.ok ? autoPassReactions(result) : result;
}

/** Préférence d'ergonomie enregistrée pour le joueur ; aucun autre changement. */
function setPreference(
  state: GameState,
  action: Extract<GameAction, { type: 'set-preference' }>,
): ActionResult {
  if (!state.players.some((p) => p.id === action.playerId))
    return { ok: false, reason: 'UNKNOWN_PLAYER' };
  return {
    ok: true,
    state: {
      ...state,
      preferences: {
        ...state.preferences,
        [action.playerId]: {
          ...state.preferences?.[action.playerId],
          [action.preference]: action.value,
        },
      },
    },
    events: [],
  };
}

/** Automatismes après une action : « you may » gratuits acceptés (sauf préférence
 * askOptional), puis option « refus automatique des réactions » — tant que la priorité sur
 * une pile non vide revient à un joueur qui l'a activée, sans choix en attente, il passe. */
function autoPassReactions(
  result: Extract<ActionResult, { ok: true }>,
): ActionResult {
  let { state } = result;
  const events = [...result.events];
  for (let i = 0; i < 50; i++) {
    // « You may » gratuit : accepté d'office sauf si son propriétaire demande à être consulté.
    const may = state.pendingModeChoice;
    const accepted =
      may?.modes.length === 2 && may.modes[0] === 'skip'
        ? may.modes[1]
        : undefined;
    if (
      may &&
      accepted &&
      isFreeMay(accepted) &&
      !state.preferences?.[may.ownerId]?.askOptional
    ) {
      const chosen = actOnce(state, {
        type: 'choose-mode',
        playerId: may.ownerId,
        mode: accepted,
      });
      if (!chosen.ok) break;
      state = chosen.state;
      events.push(...chosen.events);
      continue;
    }
    const priority = state.stack?.priorityPlayerId;
    if (
      !priority ||
      !state.preferences?.[priority]?.autoPassReactions ||
      state.pendingModeChoice ||
      state.pendingVision ||
      state.pendingDiscard ||
      state.pendingPick ||
      state.pendingAttackChoices?.length ||
      state.pendingDeaths ||
      state.result
    )
      break;
    const passed = actOnce(state, { type: 'pass', playerId: priority });
    if (!passed.ok) break;
    state = passed.state;
    events.push(...passed.events);
  }
  return { ok: true, state, events };
}

/** Modes d'un « you may » sans coût, acceptés automatiquement par défaut (réponse 8) :
 * suivre un allié, récupérer son champion, piocher, canaliser, renvoyer une unité en base. */
const FREE_MAYS = new Set([
  'follow',
  'return-champion',
  'draw',
  'channel-exhausted',
]);
function isFreeMay(mode: string): boolean {
  return FREE_MAYS.has(mode) || mode.startsWith('retreat:');
}

function actOnce(state: GameState, action: GameAction): ActionResult {
  if (
    (action.type === 'play-unit' ||
      action.type === 'cast-spell' ||
      action.type === 'play-gear') &&
    state.playLockedPlayers?.includes(action.playerId)
  )
    return { ok: false, reason: 'PLAY_LOCKED' };
  const dispatched = dispatch(state, action);
  if (!dispatched.ok) return dispatched;
  const result =
    action.type === 'play-unit' ||
    action.type === 'cast-spell' ||
    action.type === 'play-gear'
      ? {
          ...dispatched,
          state: {
            ...dispatched.state,
            cardsPlayedThisTurn: {
              ...dispatched.state.cardsPlayedThisTurn,
              [action.playerId]:
                (dispatched.state.cardsPlayedThisTurn?.[action.playerId] ?? 0) +
                1,
            },
          },
        }
      : dispatched;
  const secondCard =
    result !== dispatched &&
    result.state.cardsPlayedThisTurn?.[action.playerId] === 2;
  const settled = settleLethalUnits(result.state);
  const attached = syncAttachments(settled.state);
  const queued = queueConquestLegends(attached.state, result.events);
  const moved = queueMovementEffects(state, queued.state, [
    ...result.events,
    ...settled.events,
  ]);
  const entered = afterEffects(moved.state);
  const events = [
    ...result.events,
    ...settled.events,
    ...attached.events,
    ...queued.events,
    ...moved.events,
  ];
  const discarders = events.flatMap((e) =>
    e.type === 'card-discarded' ? [e.playerId] : [],
  );
  // Morts d'unités : leurs adversaires sont inscrits (Spoils of War).
  const deadOwners = events.flatMap((e) =>
    e.type === 'unit-died' || e.type === 'token-removed'
      ? (state.units.find((u) => u.id === e.unitId)?.ownerId ??
        entered.cards.find((c) => c.id === e.unitId)?.ownerId ??
        [])
      : [],
  );
  const beneficiaries = state.players
    .map((p) => p.id)
    .filter((id) => deadOwners.some((owner) => owner !== id));
  const tracked = beneficiaries.length
    ? {
        ...entered,
        enemyDeathsThisTurn: [
          ...new Set([
            ...(entered.enemyDeathsThisTurn ?? []),
            ...beneficiaries,
          ]),
        ],
      }
    : entered;
  const counted = countMoves(
    discarders.length
      ? {
          ...tracked,
          discardedThisTurn: [
            ...new Set([...(entered.discardedThisTurn ?? []), ...discarders]),
          ],
        }
      : tracked,
    events,
  );
  // Capacités déclenchées empilées après l'action (réponse 7 : fenêtre de réaction).
  const triggers: (ModeChoiceEntry | PlayEffectEntry)[] = [];
  const boost = (
    unitId: string,
    ownerId: string,
    rule: { might: number; ready: boolean },
  ) =>
    triggers.push({
      kind: 'play-effect',
      sourceId: unitId,
      ownerId,
      effect: { type: 'unit-boost', unitId, ...rule },
    });
  // Darius (Fury) : deuxième carte jouée ce tour, lui compris -> capacité sur la pile.
  if (secondCard)
    for (const u of counted.units) {
      const rule =
        u.ownerId === action.playerId
          ? counted.unitDefinitions?.find((d) => d.id === u.definitionId)
              ?.onSecondCardPlayed
          : undefined;
      if (rule) boost(u.id, u.ownerId, rule);
    }
  // Jinx (Chaos) : son propriétaire défausse -> capacité sur la pile.
  for (const u of counted.units) {
    const rule = discarders.includes(u.ownerId)
      ? counted.unitDefinitions?.find((d) => d.id === u.definitionId)
          ?.onOwnerDiscard
      : undefined;
    if (rule) boost(u.id, u.ownerId, rule);
  }
  // Pit Crew : son propriétaire joue un gear ; Cithria : il joue une autre unité.
  for (const e of events) {
    if (e.type === 'gear-played')
      for (const u of counted.units)
        if (
          u.ownerId === e.playerId &&
          counted.unitDefinitions?.find((d) => d.id === u.definitionId)
            ?.readyOnGearPlayed
        )
          boost(u.id, u.ownerId, { might: 0, ready: true });
    if (e.type === 'unit-played')
      for (const u of counted.units)
        if (
          u.ownerId === e.playerId &&
          u.id !== e.unitId &&
          counted.unitDefinitions?.find((d) => d.id === u.definitionId)
            ?.buffOnAllyPlayed
        )
          triggers.push({
            kind: 'play-effect',
            sourceId: u.id,
            ownerId: u.ownerId,
            effect: { type: 'buff-units', unitIds: [u.id] },
          });
  }
  const afterDiscard = counted;
  // Eclipse Herald / Radiant Dawn : unités ennemies nouvellement Stun -> déclencheurs du
  // joueur qui les a étourdies (byPlayerId ; à défaut, l'adversaire de l'unité).
  const stunners = new Set(
    afterDiscard.units
      .filter(
        (u) =>
          isStunned(u) &&
          !state.units.some((b) => b.id === u.id && isStunned(b)),
      )
      .flatMap((u) => {
        const stun = [...(u.temporaryEffects ?? [])]
          .reverse()
          .find((e) => e.type === 'stun') as
          { byPlayerId?: string } | undefined;
        const by =
          stun?.byPlayerId ??
          afterDiscard.players.find((p) => p.id !== u.ownerId)?.id;
        return by && by !== u.ownerId ? [by] : [];
      }),
  );
  // Eclipse Herald : capacité sur la pile pour chaque Herald du joueur étourdisseur.
  for (const u of afterDiscard.units) {
    const rule = stunners.has(u.ownerId)
      ? afterDiscard.unitDefinitions?.find((d) => d.id === u.definitionId)
          ?.onEnemyStunned
      : undefined;
    if (rule) boost(u.id, u.ownerId, rule);
  }
  const afterStun = afterDiscard;
  const dawn = afterStun;
  // Radiant Dawn : capacité sur la pile, l'unité buffée est choisie à la résolution.
  for (const player of dawn.players)
    for (const legend of activeLegends(dawn, player.id))
      if (stunners.has(player.id) && legend.definition.buffOnEnemyStunned)
        triggers.push(buffChoiceEntry(legend.card.id, player.id));
  // Solari Shrine : ennemi Stun mort -> gear Ready couché, pioche de son propriétaire.
  const stunnedDead = events.flatMap((e) =>
    e.type === 'unit-died' || e.type === 'token-removed'
      ? state.units.filter((u) => u.id === e.unitId && isStunned(u))
      : [],
  );
  let shrine = dawn;
  // « You may exhaust this to draw 1 » : capacité sur la pile, toujours demandée (coût).
  for (const gear of dawn.gears ?? [])
    if (
      gear.ready &&
      stunnedDead.some((u) => u.ownerId !== gear.ownerId) &&
      dawn.gearDefinitions?.find((d) => d.id === gear.definitionId)
        ?.drawOnStunnedEnemyKill
    )
      triggers.push({
        kind: 'mode-choice',
        sourceId: gear.id,
        ownerId: gear.ownerId,
        modes: [],
        costlyMay: {
          sourceKind: 'gear',
          sourceId: gear.id,
          effect: { type: 'draw' },
        },
      });
  // Volibear (Body) : déplacement adverse vers un autre champ -> pioche (pile).
  for (const e of events) {
    if (e.type !== 'unit-moved' || e.from === e.to) continue;
    const mover = state.units.find((u) => u.id === e.unitId);
    if (!mover || !shrine.battlefields.some((f) => f.zoneId === e.to)) continue;
    for (const bear of shrine.units)
      if (
        bear.ownerId !== mover.ownerId &&
        bear.zoneId !== e.to &&
        shrine.unitDefinitions?.find((d) => d.id === bear.definitionId)
          ?.drawOnEnemyMoveElsewhere
      )
        triggers.push({
          kind: 'play-effect',
          sourceId: bear.id,
          ownerId: bear.ownerId,
          effect: { type: 'draw', count: 1 },
        });
  }
  // The Dreaming Tree : premier sort du tour qui choisit une unité alliée sur ce champ.
  if (
    action.type === 'cast-spell' &&
    !shrine.dreamingTreeUsed?.includes(action.playerId)
  ) {
    const card = state.cards.find((c) => c.id === action.cardId);
    const spell = state.spellDefinitions?.find(
      (d) => d.id === card?.definitionId,
    );
    const chosen = spell ? spellChosenUnits(spell, action) : [];
    if (
      state.units.some(
        (u) =>
          chosen.includes(u.id) &&
          u.ownerId === action.playerId &&
          battlefieldDefinition(state, u.zoneId)
            ?.drawOnFirstFriendlySpellChoice,
      )
    ) {
      shrine = {
        ...shrine,
        dreamingTreeUsed: [...(shrine.dreamingTreeUsed ?? []), action.playerId],
      };
      triggers.push({
        kind: 'play-effect',
        sourceId: chosen[0]!,
        ownerId: action.playerId,
        effect: { type: 'draw', count: 1 },
      });
    }
  }
  // Ember Monk : carte jouée depuis Hidden -> bonus de Might ce tour (pile).
  if (
    (action.type === 'play-unit' || action.type === 'cast-spell') &&
    state.cards.find((c) => c.id === action.cardId)?.facedown
  )
    for (const u of shrine.units) {
      const bonus =
        u.ownerId === action.playerId
          ? shrine.unitDefinitions?.find((d) => d.id === u.definitionId)
              ?.mightOnHiddenPlay
          : undefined;
      if (bonus) boost(u.id, u.ownerId, { might: bonus, ready: false });
    }
  // Viktor (Mind) : carte jouée pendant le tour adverse -> Recrue dans la base.
  if (
    (action.type === 'play-unit' ||
      action.type === 'cast-spell' ||
      action.type === 'play-gear') &&
    action.playerId !== state.activePlayerId
  ) {
    const base = shrine.zones.find(
      (z) => z.kind === 'base' && z.ownerId === action.playerId,
    );
    for (const viktor of shrine.units) {
      const token = shrine.unitDefinitions?.find(
        (d) => d.id === viktor.definitionId,
      )?.recruitOnOffTurnPlay;
      if (!token || !base || viktor.ownerId !== action.playerId) continue;
      triggers.push({
        kind: 'play-effect',
        sourceId: viktor.id,
        ownerId: action.playerId,
        effect: {
          type: 'summon-base',
          destinationId: base.id,
          definitionId: token,
        },
      });
    }
  }
  // Viktor (Order) : chaque autre unité alliée non-Recrue morte -> Recrue dans la base.
  for (const e of events) {
    if (e.type !== 'unit-died' && e.type !== 'token-removed') continue;
    const dead = state.units.find((u) => u.id === e.unitId);
    if (
      !dead ||
      state.unitDefinitions
        ?.find((d) => d.id === dead.definitionId)
        ?.tags?.includes('Recruit')
    )
      continue;
    const base = shrine.zones.find(
      (z) => z.kind === 'base' && z.ownerId === dead.ownerId,
    );
    for (const viktor of shrine.units) {
      const token = shrine.unitDefinitions?.find(
        (d) => d.id === viktor.definitionId,
      )?.recruitOnAllyDeath;
      if (!token || !base || viktor.ownerId !== dead.ownerId) continue;
      triggers.push({
        kind: 'play-effect',
        sourceId: viktor.id,
        ownerId: dead.ownerId,
        effect: {
          type: 'summon-base',
          destinationId: base.id,
          definitionId: token,
        },
      });
    }
  }
  // Mistfall : alliée Tap nouvellement buffée -> « you may » payant sur la pile (toujours
  // demandé) : 1 Power + gear couché pour la redresser.
  for (const mist of shrine.gears ?? []) {
    const rule = shrine.gearDefinitions?.find(
      (d) => d.id === mist.definitionId,
    )?.readyOnAllyBuffed;
    if (!rule || !mist.ready) continue;
    const unit = shrine.units.find(
      (u) =>
        u.ownerId === mist.ownerId &&
        u.buffed &&
        !u.ready &&
        state.units.some((o) => o.id === u.id && !o.buffed),
    );
    if (unit)
      triggers.push({
        kind: 'mode-choice',
        sourceId: mist.id,
        ownerId: mist.ownerId,
        modes: [],
        costlyMay: {
          sourceKind: 'gear',
          sourceId: mist.id,
          power: rule.power,
          effect: { type: 'ready-unit', unitId: unit.id },
        },
      });
  }
  // Pirate's Haven : alliée redressée pendant cette action (même tour) -> bonus de Might (pile).
  if (shrine.activePlayerId === state.activePlayerId)
    for (const haven of shrine.gears ?? []) {
      const bonus = shrine.gearDefinitions?.find(
        (d) => d.id === haven.definitionId,
      )?.mightOnAllyReadied;
      if (bonus)
        for (const u of shrine.units)
          if (
            u.ownerId === haven.ownerId &&
            u.ready &&
            state.units.some((o) => o.id === u.id && !o.ready)
          )
            triggers.push({
              kind: 'play-effect',
              sourceId: haven.id,
              ownerId: haven.ownerId,
              effect: {
                type: 'unit-boost',
                unitId: u.id,
                might: bonus,
                ready: false,
              },
            });
    }
  // Karma : cartes recyclées par son propriétaire (vers le deck, ou Vision) -> buff allié.
  const recyclers = new Set([
    ...events.flatMap((e) => (e.type === 'cards-recycled' ? [e.playerId] : [])),
    ...shrine.cards
      .filter(
        (c) =>
          shrine.zones.some((z) => z.id === c.zoneId && z.kind === 'deck') &&
          state.cards.some(
            (o) =>
              o.id === c.id &&
              !state.zones.some((z) => z.id === o.zoneId && z.kind === 'deck'),
          ),
      )
      .map((c) => c.ownerId),
  ]);
  for (const owner of recyclers)
    for (const karma of shrine.units)
      if (
        karma.ownerId === owner &&
        shrine.unitDefinitions?.find((d) => d.id === karma.definitionId)
          ?.buffOnRecycle
      )
        triggers.push(buffChoiceEntry(karma.id, owner));
  // Vanguard Helm : alliée buffée morte -> une autre alliée est buffée, par gear (pile).
  for (const e of events) {
    if (e.type !== 'unit-died' && e.type !== 'token-removed') continue;
    const dead = state.units.find((u) => u.id === e.unitId);
    if (!dead?.buffed) continue;
    for (const helm of shrine.gears ?? [])
      if (
        helm.ownerId === dead.ownerId &&
        shrine.gearDefinitions?.find((d) => d.id === helm.definitionId)
          ?.buffOnBuffedAllyDeath
      )
        triggers.push({
          ...buffChoiceEntry(helm.id, dead.ownerId),
          excludeId: dead.id,
        });
  }
  // Wraith of Echoes : première mort alliée du tour -> pioche, une fois par joueur.
  const firstDeaths = [...new Set(deadOwners)].filter(
    (owner) => !shrine.allyDeathThisTurn?.includes(owner),
  );
  if (firstDeaths.length) {
    shrine = {
      ...shrine,
      allyDeathThisTurn: [...(shrine.allyDeathThisTurn ?? []), ...firstDeaths],
    };
    for (const owner of firstDeaths) {
      const wraith = shrine.units.find(
        (u) =>
          u.ownerId === owner &&
          shrine.unitDefinitions?.find((d) => d.id === u.definitionId)
            ?.drawOnFirstAllyDeath,
      );
      if (wraith)
        triggers.push({
          kind: 'play-effect',
          sourceId: wraith.id,
          ownerId: owner,
          effect: { type: 'draw', count: 1 },
        });
    }
  }
  // Flame Chompers : carte défaussée -> capacité « payer pour la jouer » sur la pile.
  const chompers: (ModeChoiceEntry | PlayEffectEntry)[] = triggers.concat(
    events.flatMap((e) => {
      if (e.type !== 'card-discarded') return [];
      const card = shrine.cards.find((c) => c.id === e.cardId);
      const rule = shrine.unitDefinitions?.find(
        (d) => d.id === card?.definitionId,
      )?.playOnDiscard;
      return card && rule
        ? [
            {
              kind: 'mode-choice' as const,
              sourceId: card.id,
              ownerId: card.ownerId,
              modes: [],
              payPlayCost: { energy: 0, power: { [rule.power]: 1 } },
            },
          ]
        : [];
    }),
  );
  // Immortal Phoenix : une unité meurt des dégâts d'un sort du joueur (pas d'un simple malus
  // sur une unité déjà blessée) -> payer pour la jouer du cimetière, Phoenix compris.
  const spellDamaged = new Set(
    events.flatMap((e) =>
      e.type === 'spell-damage' && e.amount > 0 ? [e.unitId] : [],
    ),
  );
  const spellKill =
    events.some((e) => e.type === 'spell-resolved') &&
    events.some(
      (e) =>
        (e.type === 'unit-died' || e.type === 'token-removed') &&
        spellDamaged.has(e.unitId),
    );
  const caster = events.find((e) => e.type === 'spell-resolved');
  if (spellKill && caster?.type === 'spell-resolved')
    for (const card of shrine.cards) {
      const rule = shrine.unitDefinitions?.find(
        (d) => d.id === card.definitionId,
      )?.playOnSpellKill;
      if (
        rule &&
        card.ownerId === caster.playerId &&
        shrine.zones.some((z) => z.id === card.zoneId && z.kind === 'graveyard')
      )
        chompers.push({
          kind: 'mode-choice',
          sourceId: card.id,
          ownerId: card.ownerId,
          modes: [],
          payPlayCost: rule,
        });
    }
  const lostFacedown = trashLostFacedown(shrine);
  events.push(...lostFacedown.events);
  shrine = lostFacedown.state;
  chompers.push(
    ...scrapheapDraws(shrine, events),
    ...treasureTroves(shrine, events),
    ...thirdMovePoints(entered, shrine),
  );
  if (chompers.length)
    shrine = {
      ...shrine,
      stack: {
        entries: [...(shrine.stack?.entries ?? []), ...chompers],
        initiatorId: shrine.stack?.initiatorId ?? shrine.activePlayerId,
        priorityPlayerId:
          shrine.stack?.priorityPlayerId ?? shrine.activePlayerId,
        consecutivePasses: 0,
      },
    };
  const attacked = queueAttackEffects(state, shrine, events);
  const next = queueDefendRetreat(
    state,
    queueDefenseShield(state, attacked.state, events),
    events,
  );
  events.push(...attacked.events);
  if (
    next.pendingTurnEnd &&
    !next.result &&
    !next.stack &&
    !next.pendingDeaths &&
    !next.showdown
  ) {
    const started = startNextTurn(next);
    return { ...started, events: [...events, ...started.events] };
  }
  if (
    next.pendingTurnStart &&
    !next.result &&
    !next.stack &&
    !next.pendingDeaths &&
    !next.showdown
  ) {
    const resumed = resumeTurn(next);
    return { ...resumed, events: [...events, ...resumed.events] };
  }
  const opened = !result.state.showdown && next.showdown;
  return {
    ...result,
    state: next,
    events: opened
      ? [
          ...events,
          { type: 'showdown-opened', battlefieldId: opened.battlefieldId },
        ]
      : events,
  };
}

function dispatch(state: GameState, action: GameAction): ActionResult {
  if (state.result) return { ok: false, reason: 'GAME_OVER' };
  if (!state.players.some((player) => player.id === action.playerId)) {
    return { ok: false, reason: 'UNKNOWN_PLAYER' };
  }
  if (action.type === 'choose-hold-channel')
    return chooseHoldChannel(state, action);
  if (state.pendingHoldChannel)
    return { ok: false, reason: 'HOLD_CHANNEL_CHOICE_REQUIRED' };
  if (action.type === 'choose-mode') return chooseMode(state, action);
  if (state.pendingModeChoice)
    return { ok: false, reason: 'MODE_CHOICE_REQUIRED' };
  if (action.type === 'choose-vision') return chooseVision(state, action);
  if (state.pendingVision)
    return { ok: false, reason: 'VISION_CHOICE_REQUIRED' };
  if (action.type === 'choose-pick') return choosePick(state, action);
  if (state.pendingPick) return { ok: false, reason: 'PICK_CHOICE_REQUIRED' };
  if (action.type === 'choose-discard') return chooseDiscard(state, action);
  if (state.pendingDiscard)
    return { ok: false, reason: 'DISCARD_CHOICE_REQUIRED' };
  if (action.type === 'queue-death-effects')
    return queueDeathEffects(state, action);
  if (state.pendingDeaths)
    return { ok: false, reason: 'DEATH_CHOICES_REQUIRED' };

  if (action.type === 'choose-attack-targets')
    return chooseAttackTargets(state, action);
  if (state.pendingAttackChoices?.length)
    return { ok: false, reason: 'ATTACK_CHOICES_REQUIRED' };
  if (action.type === 'choose-defense-shield')
    return chooseDefenseShield(state, action);
  if (state.pendingDefenseShield)
    return { ok: false, reason: 'DEFENSE_CHOICE_REQUIRED' };
  if (action.type === 'choose-battlefield')
    return chooseBattlefield(state, action);
  if (action.type === 'choose-first-player')
    return chooseFirstPlayer(state, action);
  if (action.type === 'mulligan') return mulligan(state, action);
  if (state.setup || state.phase === 'setup')
    return { ok: false, reason: 'SETUP_IN_PROGRESS' };
  if (action.type === 'hide-card') return hideCard(state, action);
  if (action.type === 'spend-buff-ability')
    return spendBuffAbility(state, action);
  if (action.type === 'trash-recycle-ability')
    return trashRecycleAbility(state, action);
  if (
    state.stack &&
    !(
      action.type === 'play-gear' &&
      playableFacedown(
        state,
        state.cards.find((c) => c.id === action.cardId),
        action.playerId,
      )
    ) &&
    !(
      action.type === 'play-unit' &&
      (playableFacedown(
        state,
        state.cards.find((c) => c.id === action.cardId),
        action.playerId,
      ) ||
        state.unitDefinitions?.find(
          (d) =>
            d.id ===
            state.cards.find((c) => c.id === action.cardId)?.definitionId,
        )?.reactionTiming)
    ) &&
    action.type !== 'cast-spell' &&
    action.type !== 'pass' &&
    action.type !== 'activate-spell-energy' &&
    action.type !== 'tap-rune' &&
    action.type !== 'activate-gear' &&
    action.type !== 'recycle-rune'
  )
    return { ok: false, reason: 'STACK_IN_PROGRESS' };
  if (
    !state.stack &&
    !state.showdown &&
    state.priorityPlayerId &&
    state.priorityPlayerId !== action.playerId
  )
    return { ok: false, reason: 'NO_PRIORITY' };
  switch (action.type) {
    case 'activate-spell-energy':
      return activateSpellEnergy(state, action);
    case 'tap-rune':
      return tapRune(state, action);
    case 'activate-gear':
      return activateGear(state, action);
    case 'recycle-rune':
      return recycleRune(state, action);
    case 'play-gear':
      return playGear(state, action);
    case 'equip-gear':
      return equipGear(state, action);
    case 'cast-spell':
      return castSpell(state, action);
    case 'play-unit':
      return playUnit(state, action);
    case 'assign-damage':
      return assignDamage(state, action);
    case 'move-group':
      return moveGroup(state, action);
    case 'move':
      return moveUnit(state, action);
    case 'pass':
      if (state.stack) return passStack(state, action.playerId);
      if (
        !state.showdown &&
        state.priorityPlayerId === action.playerId &&
        action.playerId !== state.activePlayerId
      )
        return {
          ok: true,
          state: { ...state, priorityPlayerId: state.activePlayerId },
          events: [{ type: 'priority-passed', playerId: action.playerId }],
        };
      return passPriority(state, action);
    case 'end-turn':
      return endTurn(state, action);
    case 'set-preference':
      return setPreference(state, action);
    default: {
      // TypeScript signale ici tout nouveau type d'action sans traitement associé.
      const unhandled: never = action;
      return unhandled;
    }
  }
}

/** Événements unit-moved effectifs -> compteur de déplacements du tour sur chaque unité. */
function countMoves(state: GameState, events: readonly GameEvent[]): GameState {
  const moves = new Map<string, number>();
  for (const e of events)
    if (e.type === 'unit-moved' && e.from !== e.to)
      moves.set(e.unitId, (moves.get(e.unitId) ?? 0) + 1);
  if (!moves.size) return state;
  // Back-Alley Bar : bonus de Might pour chaque départ du champ.
  const bonus = new Map<string, number>();
  for (const e of events)
    if (e.type === 'unit-moved' && e.from !== e.to) {
      const amount = battlefieldDefinition(state, e.from)?.moveOutMightBonus;
      if (amount) bonus.set(e.unitId, (bonus.get(e.unitId) ?? 0) + amount);
    }
  return {
    ...state,
    units: state.units.map((u) =>
      moves.has(u.id)
        ? {
            ...u,
            movesThisTurn: (u.movesThisTurn ?? 0) + moves.get(u.id)!,
            ...(bonus.has(u.id)
              ? {
                  temporaryEffects: [
                    ...(u.temporaryEffects ?? []),
                    { type: 'modify-might' as const, amount: bonus.get(u.id)! },
                  ],
                }
              : {}),
          }
        : u,
    ),
  };
}

/** Yasuo (Chaos) : unité passée à 3 déplacements ce tour -> capacité « 1 point » empilée. */
function thirdMovePoints(
  before: GameState,
  state: GameState,
): PlayEffectEntry[] {
  return state.units.flatMap((unit) => {
    const previous =
      before.units.find((u) => u.id === unit.id)?.movesThisTurn ?? 0;
    return previous < 3 &&
      (unit.movesThisTurn ?? 0) >= 3 &&
      state.unitDefinitions?.find((d) => d.id === unit.definitionId)
        ?.scoreOnThirdMove
      ? [
          {
            kind: 'play-effect' as const,
            sourceId: unit.id,
            ownerId: unit.ownerId,
            effect: { type: 'score-points' as const, amount: 1 },
          },
        ]
      : [];
  });
}

/** Treasure Trove : gear détruit (onLeaveDrawChannel) -> pioche 1 puis canalise 1 rune Tap,
 * empilés pour son propriétaire. */
function treasureTroves(
  state: GameState,
  events: readonly GameEvent[],
): PlayEffectEntry[] {
  return events.flatMap((e) => {
    if (e.type !== 'gear-killed') return [];
    const definitionId = state.cards.find(
      (c) => c.id === e.gearId,
    )?.definitionId;
    if (
      !state.gearDefinitions?.find((d) => d.id === definitionId)
        ?.onLeaveDrawChannel
    )
      return [];
    return [
      {
        kind: 'play-effect' as const,
        sourceId: e.gearId,
        ownerId: e.ownerId,
        effect: { type: 'draw' as const, count: 1 },
      },
      {
        kind: 'play-effect' as const,
        sourceId: e.gearId,
        ownerId: e.ownerId,
        effect: { type: 'channel-exhausted' as const, count: 1 },
      },
    ];
  });
}

/** Scrapheap : gear posé, défaussé ou détruit -> pioche 1 empilée par événement. */
function scrapheapDraws(
  state: GameState,
  events: readonly GameEvent[],
): PlayEffectEntry[] {
  const drawing = (definitionId: string | undefined) =>
    !!state.gearDefinitions?.find((d) => d.id === definitionId)
      ?.drawOnPlayDiscardOrKill;
  return events.flatMap((e) => {
    let owner: string | undefined;
    let sourceId = '';
    if (e.type === 'gear-played') {
      sourceId = e.gearId;
      if (drawing(state.gears?.find((g) => g.id === e.gearId)?.definitionId))
        owner = e.playerId;
    } else if (e.type === 'gear-killed' || e.type === 'card-discarded') {
      sourceId = e.type === 'gear-killed' ? e.gearId : e.cardId;
      const card = state.cards.find((c) => c.id === sourceId);
      if (drawing(card?.definitionId))
        owner = e.type === 'gear-killed' ? e.ownerId : e.playerId;
    }
    return owner
      ? [
          {
            kind: 'play-effect' as const,
            sourceId,
            ownerId: owner,
            effect: { type: 'draw' as const, count: 1 },
          },
        ]
      : [];
  });
}
