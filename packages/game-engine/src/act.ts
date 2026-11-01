import { spendBuffAbility } from './actions/spend-buff-ability.js';
import {
  hideCard,
  playableFacedown,
  trashLostFacedown,
} from './effects/hidden.js';
import { channelForPlayer } from './turn/supplies.js';
import { chooseMode } from './effects/mode-choice.js';
import { spellChosenUnits } from './cost/deflect.js';
import { choosePick } from './effects/pick.js';
import { summonToken } from './effects/summon-token.js';
import { activeLegends } from './effects/legends.js';
import { buffUnit } from './effects/buff.js';
import { isStunned } from './effects/modifiers.js';
import { drawCardForPlayer } from './turn/draw.js';
import { battlefieldDefinition } from './effects/battlefield.js';
import { awardPoints } from './effects/hold-units.js';
import {
  chooseDefenseShield,
  queueDefenseShield,
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
  if (
    result !== dispatched &&
    result.state.cardsPlayedThisTurn?.[action.playerId] === 2
  )
    result.state = secondCardTriggers(result.state, action.playerId);
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
  const afterDiscard = discarders.length
    ? {
        ...counted,
        units: counted.units.map((u) => {
          const trigger = discarders.includes(u.ownerId)
            ? counted.unitDefinitions?.find((d) => d.id === u.definitionId)
                ?.onOwnerDiscard
            : undefined;
          return trigger
            ? {
                ...u,
                ready: u.ready || trigger.ready,
                temporaryEffects: [
                  ...(u.temporaryEffects ?? []),
                  { type: 'modify-might' as const, amount: trigger.might },
                ],
              }
            : u;
        }),
      }
    : counted;
  // Eclipse Herald : unités ennemies nouvellement Stun -> déclencheurs de leurs adversaires.
  const stunnedOwners = new Set(
    afterDiscard.units
      .filter(
        (u) =>
          isStunned(u) &&
          !state.units.some((b) => b.id === u.id && isStunned(b)),
      )
      .map((u) => u.ownerId),
  );
  const afterStun = stunnedOwners.size
    ? {
        ...afterDiscard,
        units: afterDiscard.units.map((u) => {
          const trigger = [...stunnedOwners].some((o) => o !== u.ownerId)
            ? afterDiscard.unitDefinitions?.find((d) => d.id === u.definitionId)
                ?.onEnemyStunned
            : undefined;
          return trigger
            ? {
                ...u,
                ready: u.ready || trigger.ready,
                temporaryEffects: [
                  ...(u.temporaryEffects ?? []),
                  { type: 'modify-might' as const, amount: trigger.might },
                ],
              }
            : u;
        }),
      }
    : afterDiscard;
  let dawn = afterStun;
  for (const player of dawn.players)
    if (
      [...stunnedOwners].some((o) => o !== player.id) &&
      activeLegends(dawn, player.id).some(
        (l) => l.definition.buffOnEnemyStunned,
      )
    ) {
      const pick = [...dawn.units]
        .filter((u) => u.ownerId === player.id)
        .sort((x, y) => Number(!!x.buffed) - Number(!!y.buffed))[0];
      if (pick) dawn = buffUnit(dawn, pick.id);
    }
  // Solari Shrine : ennemi Stun mort -> gear Ready couché, pioche de son propriétaire.
  const stunnedDead = events.flatMap((e) =>
    e.type === 'unit-died' || e.type === 'token-removed'
      ? state.units.filter((u) => u.id === e.unitId && isStunned(u))
      : [],
  );
  let shrine = dawn;
  const shrineEvents: GameEvent[] = [];
  for (const gear of dawn.gears ?? []) {
    if (
      !gear.ready ||
      !stunnedDead.some((u) => u.ownerId !== gear.ownerId) ||
      !dawn.gearDefinitions?.find((d) => d.id === gear.definitionId)
        ?.drawOnStunnedEnemyKill
    )
      continue;
    shrine = {
      ...shrine,
      gears: shrine.gears!.map((g) =>
        g.id === gear.id ? { ...g, ready: false } : g,
      ),
    };
    const drawn = drawCardForPlayer(shrine, gear.ownerId);
    shrine = drawn.state;
    shrineEvents.push(...drawn.events);
  }
  events.push(...shrineEvents);
  // Volibear (Body) : déplacement adverse vers un autre champ -> pioche.
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
      ) {
        const drawn = drawCardForPlayer(shrine, bear.ownerId);
        shrine = drawn.state;
        events.push(...drawn.events);
      }
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
      const drawn = drawCardForPlayer(shrine, action.playerId);
      shrine = drawn.state;
      events.push(...drawn.events);
    }
  }
  // Ember Monk : carte jouée depuis Hidden -> bonus de Might ce tour (sans pile).
  if (
    (action.type === 'play-unit' || action.type === 'cast-spell') &&
    state.cards.find((c) => c.id === action.cardId)?.facedown
  )
    shrine = {
      ...shrine,
      units: shrine.units.map((u) => {
        const bonus =
          u.ownerId === action.playerId
            ? shrine.unitDefinitions?.find((d) => d.id === u.definitionId)
                ?.mightOnHiddenPlay
            : undefined;
        return bonus
          ? {
              ...u,
              temporaryEffects: [
                ...(u.temporaryEffects ?? []),
                { type: 'modify-might' as const, amount: bonus },
              ],
            }
          : u;
      }),
    };
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
      const summoned = summonToken(
        shrine,
        action.playerId,
        base.id,
        token,
        'here',
      );
      shrine = summoned.state;
      events.push(...summoned.events);
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
      const summoned = summonToken(
        shrine,
        dead.ownerId,
        base.id,
        token,
        'here',
      );
      shrine = summoned.state;
      events.push(...summoned.events);
    }
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
    for (const owner of firstDeaths)
      if (
        shrine.units.some(
          (u) =>
            u.ownerId === owner &&
            shrine.unitDefinitions?.find((d) => d.id === u.definitionId)
              ?.drawOnFirstAllyDeath,
        )
      ) {
        const drawn = drawCardForPlayer(shrine, owner);
        shrine = drawn.state;
        events.push(...drawn.events);
      }
  }
  const lostFacedown = trashLostFacedown(shrine);
  events.push(...lostFacedown.events);
  const scrapped = scrapheapDraws(lostFacedown.state, events);
  events.push(...scrapped.events);
  const scrap = treasureTroves(scrapped.state, events);
  events.push(...scrap.events);
  const scoredMoves = thirdMovePoints(entered, scrap.state);
  events.push(...scoredMoves.events);
  const attacked = queueAttackEffects(state, scoredMoves.state, events);
  const next = queueDefenseShield(state, attacked.state, events);
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
  if (
    state.stack &&
    !(
      action.type === 'play-unit' &&
      playableFacedown(
        state,
        state.cards.find((c) => c.id === action.cardId),
        action.playerId,
      )
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

/** Deuxième carte jouée du tour -> unités onSecondCardPlayed du joueur (Darius Fury). */
function secondCardTriggers(state: GameState, playerId: string): GameState {
  return {
    ...state,
    units: state.units.map((u) => {
      const trigger =
        u.ownerId === playerId
          ? state.unitDefinitions?.find((d) => d.id === u.definitionId)
              ?.onSecondCardPlayed
          : undefined;
      if (!trigger) return u;
      return {
        ...u,
        ready: u.ready || trigger.ready,
        temporaryEffects: [
          ...(u.temporaryEffects ?? []),
          { type: 'modify-might' as const, amount: trigger.might },
        ],
      };
    }),
  };
}

/** Yasuo (Chaos) : unité passée à 3 déplacements ce tour -> 1 point pour son propriétaire. */
function thirdMovePoints(
  before: GameState,
  state: GameState,
): { state: GameState; events: GameEvent[] } {
  let next = state;
  const events: GameEvent[] = [];
  for (const unit of state.units) {
    const previous =
      before.units.find((u) => u.id === unit.id)?.movesThisTurn ?? 0;
    if (
      previous < 3 &&
      (unit.movesThisTurn ?? 0) >= 3 &&
      state.unitDefinitions?.find((d) => d.id === unit.definitionId)
        ?.scoreOnThirdMove
    ) {
      const awarded = awardPoints(next, unit.ownerId, 1, unit.id);
      next = awarded.state;
      events.push(...awarded.events);
    }
  }
  return { state: next, events };
}

/** Treasure Trove : gear détruit (onLeaveDrawChannel) -> son propriétaire pioche 1 puis
 * canalise 1 rune Tap, par événement, sans pile. */
function treasureTroves(
  state: GameState,
  events: readonly GameEvent[],
): { state: GameState; events: GameEvent[] } {
  let next = state;
  const added: GameEvent[] = [];
  for (const e of events) {
    if (e.type !== 'gear-killed' || next.result) continue;
    const definitionId = next.cards.find(
      (c) => c.id === e.gearId,
    )?.definitionId;
    if (
      !next.gearDefinitions?.find((d) => d.id === definitionId)
        ?.onLeaveDrawChannel
    )
      continue;
    const drawn = drawCardForPlayer(next, e.ownerId);
    added.push(...drawn.events);
    const channeled = channelForPlayer(drawn.state, e.ownerId, 1);
    next = channeled.state;
    added.push(...channeled.events);
  }
  return { state: next, events: added };
}

/** Scrapheap : gear posé, défaussé ou détruit -> son propriétaire pioche 1 par événement. */
function scrapheapDraws(
  state: GameState,
  events: readonly GameEvent[],
): { state: GameState; events: GameEvent[] } {
  const drawing = (definitionId: string | undefined) =>
    !!state.gearDefinitions?.find((d) => d.id === definitionId)
      ?.drawOnPlayDiscardOrKill;
  const owners = events.flatMap((e) => {
    if (e.type === 'gear-played')
      return drawing(state.gears?.find((g) => g.id === e.gearId)?.definitionId)
        ? [e.playerId]
        : [];
    if (e.type === 'gear-killed' || e.type === 'card-discarded') {
      const card = state.cards.find(
        (c) => c.id === (e.type === 'gear-killed' ? e.gearId : e.cardId),
      );
      return drawing(card?.definitionId)
        ? [e.type === 'gear-killed' ? e.ownerId : e.playerId]
        : [];
    }
    return [];
  });
  let next = state;
  const drawn: GameEvent[] = [];
  for (const owner of owners) {
    if (next.result) break;
    const r = drawCardForPlayer(next, owner);
    next = r.state;
    drawn.push(...r.events);
  }
  return { state: next, events: drawn };
}
