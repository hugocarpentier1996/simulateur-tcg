import type { ActionResult, GameEvent, GameState } from '../types.js';
import type { SpellEntry } from '../spell-types.js';
import { spellTarget, validDestination } from './target.js';
import { drawCardForPlayer } from '../turn/draw.js';
import { settleLethalUnits } from './lethal-units.js';

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
    if (effect.type === 'draw') {
      for (let i = 0; i < effect.count && !state.result; i++) {
        const drawn = drawCardForPlayer(state, entry.casterId);
        state = drawn.state;
        events.push(...drawn.events);
      }
      continue;
    }
    const target = spellTarget(
      state,
      entry.definition,
      entry.targetId,
      entry.casterId,
    );
    if (!target) continue;
    if (effect.type === 'damage') {
      state = {
        ...state,
        units: state.units.map((u) =>
          u.id === target.id ? { ...u, damage: u.damage + effect.amount } : u,
        ),
      };
      events.push({
        type: 'spell-damage',
        cardId: entry.card.id,
        unitId: target.id,
        amount: effect.amount,
      });
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
