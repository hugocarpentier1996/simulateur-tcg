import { channelForPlayer } from '../turn/supplies.js';
import { returnGraveyardCard } from './graveyard-card.js';
import { effectiveMight } from './modifiers.js';
import { leaveBoard } from './leave-board.js';
import { getBattlefieldSides } from '../battlefield-areas.js';
import { dealAreaDamage } from './area-damage.js';
import type { ActionResult, GameEvent, GameState } from '../types.js';
import type { SpellEntry } from '../spell-types.js';
import {
  spellTarget,
  validDestination,
  duelEnemyTarget,
  validBattlefieldTarget,
} from './target.js';
import { resolveDuel } from './duel.js';
import { drawCardForPlayer } from '../turn/draw.js';
import { settleLethalUnits } from './lethal-units.js';
import { dealSpellDamage } from './spell-damage.js';
import { summonToken } from './summon-token.js';
import { resolveFlash } from './flash.js';

/** Sort payé -> effets dans l'ordre puis carte au cimetière. Aucune fenêtre au milieu
 * des instructions d'un même sort. Cible devenue illégale : effet ciblé ignoré ;
 * la pioche indépendante reste exécutée. Ces choix de prototype sont documentés. */
export function resolveSpell(
  input: GameState,
  entry: SpellEntry,
): Extract<ActionResult, { ok: true }> {
  let state = input;
  const events: GameEvent[] = [];
  for (const effect of entry.definition.effects) {
    if (state.result) break;
    if (effect.type === 'summon-recruits') {
      for (const destinationId of entry.tokenDestinations ?? []) {
        const summoned = summonToken(
          state,
          entry.casterId,
          destinationId,
          effect.definitionId,
        );
        state = summoned.state;
        events.push(...summoned.events);
      }
      continue;
    }
    if (effect.type === 'move-up-to-two-allies-to-base') {
      const moved = resolveFlash(
        state,
        entry.casterId,
        entry.selectedUnitIds ?? [],
      );
      state = moved.state;
      events.push(...moved.events);
      continue;
    }
    if (
      effect.type === 'boost-allies' ||
      effect.type === 'boost-selected-allies'
    ) {
      state = {
        ...state,
        units: state.units.map((u) =>
          u.ownerId === entry.casterId &&
          (effect.type === 'boost-allies' ||
            entry.selectedUnitIds?.includes(u.id))
            ? {
                ...u,
                temporaryEffects: [
                  ...(u.temporaryEffects ?? []),
                  { type: 'modify-might' as const, amount: effect.amount },
                ],
              }
            : u,
        ),
      };
      continue;
    }
    if (effect.type === 'return-graveyard-unit') {
      state = returnGraveyardCard(
        state,
        entry.casterId,
        entry.targetId,
        'unit',
      );
      continue;
    }
    if (effect.type === 'channel-exhausted') {
      const channeled = channelForPlayer(state, entry.casterId, effect.count);
      state = channeled.state;
      events.push(...channeled.events);
      if (
        effect.drawIfEmpty &&
        !channeled.events.some(
          (e) => e.type === 'runes-channeled' && e.cardIds.length,
        )
      ) {
        const drawn = drawCardForPlayer(state, entry.casterId);
        state = drawn.state;
        events.push(...drawn.events);
      }
      continue;
    }
    if (effect.type === 'draw') {
      for (let i = 0; i < effect.count && !state.result; i++) {
        const drawn = drawCardForPlayer(state, entry.casterId);
        state = drawn.state;
        events.push(...drawn.events);
      }
      continue;
    }
    if (
      effect.type === 'damage-enemies-at-battlefield' ||
      effect.type === 'damage-enemies-in-combat'
    ) {
      const fieldId =
        effect.type === 'damage-enemies-in-combat'
          ? state.showdown?.kind === 'combat'
            ? state.showdown.battlefieldId
            : undefined
          : entry.targetId;
      if (!fieldId || !validBattlefieldTarget(state, fieldId)) continue;
      const areas = getBattlefieldSides(state, fieldId).filter(
        (side) => side.playerId !== entry.casterId,
      );
      const damaged = dealAreaDamage(
        state,
        { kind: 'spell', cardId: entry.card.id, playerId: entry.casterId },
        areas,
        effect.amount,
      );
      state = damaged.state;
      events.push(...damaged.events);
      continue;
    }
    const target = spellTarget(
      state,
      entry.definition,
      entry.targetId,
      entry.casterId,
    );
    if (!target) continue;
    if (effect.type === 'return-unit-to-hand') {
      const left = leaveBoard(state, target, 'hand');
      state = left.state;
      events.push(...left.events);
    } else if (effect.type === 'kill-unit') {
      const killed = settleLethalUnits(state, new Set([target.id]));
      state = killed.state;
      events.push(...killed.events);
    } else if (effect.type === 'duel') {
      const enemy = duelEnemyTarget(
        state,
        entry.casterId,
        entry.secondaryTargetId,
      );
      if (!enemy) continue;
      const duel = resolveDuel(state, target, enemy);
      state = duel.state;
      events.push(...duel.events);
    } else if (effect.type === 'damage') {
      const damaged = dealSpellDamage(
        state,
        entry.card.id,
        entry.casterId,
        [target],
        effect.amount,
      );
      state = damaged.state;
      events.push(...damaged.events);
    } else if (effect.type === 'move-unit') {
      if (!validDestination(state, target, entry.destinationId)) continue;
      const destinationId = entry.destinationId!;
      state = {
        ...state,
        units: state.units.map((u) =>
          u.id === target.id ? { ...u, zoneId: destinationId } : u,
        ),
      };
      state = {
        ...state,
        battlefields: state.battlefields.map((f) =>
          f.zoneId !== state.showdown?.battlefieldId &&
          !state.units.some(
            (u) => u.zoneId === f.zoneId && u.ownerId === f.controllerId,
          )
            ? { ...f, controllerId: null }
            : f,
        ),
      };
      if (
        destinationId !== target.zoneId &&
        state.battlefields.some((f) => f.zoneId === destinationId) &&
        destinationId !== state.showdown?.battlefieldId
      ) {
        state = {
          ...state,
          pendingShowdowns: [
            ...(state.pendingShowdowns ?? []),
            { battlefieldId: destinationId, initiatorId: target.ownerId },
          ],
        };
      }
      events.push({
        type: 'unit-moved',
        unitId: target.id,
        from: target.zoneId,
        to: destinationId,
      });
    } else {
      const modifier =
        effect.type === 'modify-might'
          ? {
              type: 'modify-might' as const,
              amount:
                effect.minimum === undefined
                  ? effect.amount +
                    (state.units.filter(
                      (u) =>
                        u.ownerId === target.ownerId &&
                        u.zoneId === target.zoneId,
                    ).length === 1
                      ? (effect.aloneBonus ?? 0)
                      : 0)
                  : Math.max(
                      effect.amount,
                      Math.min(
                        0,
                        effect.minimum - effectiveMight(target, state),
                      ),
                    ),
            }
          : { type: effect.type };
      state = {
        ...state,
        units: state.units.map((u) =>
          u.id === target.id
            ? {
                ...u,
                temporaryEffects: [...(u.temporaryEffects ?? []), modifier],
              }
            : u,
        ),
      };
    }
  }
  const grave = state.zones.find(
    (z) => z.ownerId === entry.card.ownerId && z.kind === 'graveyard',
  );
  if (!grave) throw new Error('Cimetière absent pour le sort résolu.');
  state = {
    ...state,
    cards: [...state.cards, { ...entry.card, zoneId: grave.id }],
  };
  events.push({
    type: 'spell-resolved',
    playerId: entry.casterId,
    cardId: entry.card.id,
    targetId: entry.targetId,
  });
  const settled = settleLethalUnits(state);
  return { ...settled, events: [...events, ...settled.events] };
}
