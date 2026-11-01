import type { ModeChoiceEntry } from '../effects/mode-choice.js';
import { killGears } from '../effects/kill-gear.js';
import { activeLegends } from '../effects/legends.js';
import { handSize } from '../effects/loot.js';
import { channelForPlayer } from './supplies.js';
import { awardPoints } from '../effects/hold-units.js';
import { battlefieldDefinition } from '../effects/battlefield.js';
import { settleLethalUnits } from '../effects/lethal-units.js';
import { queueHoldChannel, queueHoldDraw } from '../effects/hold-channel.js';
import { queueHoldUnits } from '../effects/hold-units.js';
import type { ActionResult, GameEvent, GameState } from '../types.js';
import { scoreBattlefield } from '../scoring/battlefield.js';

/** État en Beginning -> +1 par champ contrôlé non encore scoré ce tour.
 * Conserve la source HOLD et inscrit les champs dans le registre partagé avec
 * la conquête. Arrête les gains dès la victoire. Le contrôle fourni fait autorité ;
 * aucun Showdown ne doit être actif. Les champs suivent leur ordre dans l'état. */
export function scoreHolding(
  input: GameState,
): Extract<ActionResult, { ok: true }> {
  const playerId = input.activePlayerId;
  const first = firstBeginning(input, playerId);
  let state = first.state;
  // Temporary : ses unités meurent avant le score.
  const temporary = new Set(
    state.units
      .filter((u) => u.ownerId === playerId && u.temporary)
      .map((u) => u.id),
  );
  state = recycleTrash(state, playerId);
  const killed = temporary.size
    ? settleLethalUnits(state, temporary)
    : { state, events: [] as GameEvent[] };
  state = killed.state;
  const fadingGears = killGears(
    state,
    (state.gears ?? [])
      .filter((g) => g.ownerId === playerId && g.temporary)
      .map((g) => g.id),
  );
  state = fadingGears.state;
  killed.events.push(...fadingGears.events);
  state = queueBeginningLegends(state, playerId);
  const scored = state.scoredBattlefields[playerId] ?? [];
  const fields = state.battlefields.filter(
    (field) =>
      field.controllerId === playerId && !scored.includes(field.zoneId),
  );
  const events: GameEvent[] = [...first.events, ...killed.events];
  let current = state;
  for (const field of fields) {
    if (current.result) break;
    const needed = battlefieldDefinition(current, field.zoneId)?.holdWinUnits;
    if (
      needed !== undefined &&
      current.units.filter(
        (u) => u.ownerId === playerId && u.zoneId === field.zoneId,
      ).length >= needed
    ) {
      const result = { winnerId: playerId, reason: 'GRAND_PLAZA' as const };
      current = { ...current, result };
      events.push({ type: 'game-ended', ...result });
      break;
    }
    const result = scoreBattlefield(current, playerId, field.zoneId, 'HOLD');
    current = queueHoldChannel(result.state, playerId, field.zoneId);
    current = queueHoldDraw(current, playerId, field.zoneId);
    if (result.events.some((e) => e.type === 'point-scored'))
      current = queueHoldUnits(current, playerId, field.zoneId);
    events.push(...result.events);
  }
  return { ok: true, state: current, events };
}

/** Dr. Mundo : chaque unité du joueur actif empile un recyclage de son cimetière ; les
 * cartes sont choisies par le joueur à la résolution. */
function recycleTrash(state: GameState, playerId: string): GameState {
  const entries: ModeChoiceEntry[] = state.units.flatMap((u) => {
    const count =
      u.ownerId === playerId
        ? state.unitDefinitions?.find((d) => d.id === u.definitionId)
            ?.recycleTrashAtBeginning
        : undefined;
    return count
      ? [
          {
            kind: 'mode-choice' as const,
            sourceId: u.id,
            ownerId: playerId,
            modes: [],
            recycleLeft: count,
            recycleOwn: true,
            recycleMandatory: true,
            recycleCompute: true,
          },
        ]
      : [];
  });
  if (!entries.length) return state;
  return {
    ...state,
    stack: {
      entries: [...(state.stack?.entries ?? []), ...entries],
      initiatorId: state.stack?.initiatorId ?? playerId,
      priorityPlayerId: state.activePlayerId,
      consecutivePasses: 0,
    },
  };
}

/** Première Beginning du joueur -> effets des champs en jeu (The Arena's Greatest : 1 point),
 * puis inscription du joueur ; ensuite plus rien. */
function firstBeginning(
  state: GameState,
  playerId: string,
): { state: GameState; events: GameEvent[] } {
  if (
    state.firstBeginningDone?.includes(playerId) ||
    !state.battlefields.some(
      (f) => battlefieldDefinition(state, f.zoneId)?.firstBeginning,
    )
  )
    return { state, events: [] };
  let next: GameState = {
    ...state,
    firstBeginningDone: [...(state.firstBeginningDone ?? []), playerId],
  };
  const events: GameEvent[] = [];
  for (const field of state.battlefields) {
    const effect = battlefieldDefinition(state, field.zoneId)?.firstBeginning;
    if (effect === 'channel') {
      const channeled = channelForPlayer(next, playerId, 1, true);
      next = channeled.state;
      events.push(...channeled.events);
    }
    if (effect === 'point') {
      const awarded = awardPoints(next, playerId, 1, field.zoneId);
      next = awarded.state;
      events.push(...awarded.events);
    }
  }
  return { state: next, events };
}

/** Loose Cannon : début de Beginning, main de taille limitée -> pioche 1 empilée.
 * Mushroom Pouch : idem si le joueur a une carte cachée sur un champ. */
function queueBeginningLegends(state: GameState, playerId: string): GameState {
  const entries = activeLegends(state, playerId).flatMap(
    ({ card, definition }) =>
      definition.beginningDrawIfHandAtMost !== undefined &&
      handSize(state, playerId) <= definition.beginningDrawIfHandAtMost
        ? [
            {
              kind: 'legend-draw' as const,
              sourceId: card.id,
              ownerId: playerId,
              count: 1,
            },
          ]
        : [],
  );
  if (state.cards.some((c) => c.facedown && c.ownerId === playerId))
    for (const gear of state.gears ?? [])
      if (
        gear.ownerId === playerId &&
        state.gearDefinitions?.find((d) => d.id === gear.definitionId)
          ?.beginningDrawIfFacedown
      )
        entries.push({
          kind: 'legend-draw',
          sourceId: gear.id,
          ownerId: playerId,
          count: 1,
        });
  if (!entries.length) return state;
  return {
    ...state,
    stack: {
      entries: [...(state.stack?.entries ?? []), ...entries],
      initiatorId: state.stack?.initiatorId ?? playerId,
      priorityPlayerId: state.activePlayerId,
      consecutivePasses: 0,
    },
  };
}
