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
    if (effect.type === 'boost-allies') {
      state = {
        ...state,
        units: state.units.map((u) =>
          u.ownerId === entry.casterId
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
    if (effect.type === 'draw') {
      for (let i = 0; i < effect.count && !state.result; i++) {
        const drawn = drawCardForPlayer(state, entry.casterId);
        state = drawn.state;
        events.push(...drawn.events);
      }
      continue;
    }
    if (effect.type === 'damage-enemies-at-battlefield') {
      if (!validBattlefieldTarget(state, entry.targetId)) continue;
      const areas = getBattlefieldSides(state, entry.targetId).filter(
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
    if (effect.type === 'kill-unit') {
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
          ? { type: 'modify-might' as const, amount: effect.amount }
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
