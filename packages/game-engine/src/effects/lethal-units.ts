import type { ActionResult, GameState, GameEvent } from '../types.js';
import type { DeathTrigger } from '../death-types.js';
import { effectiveMight } from './modifiers.js';
import { replaceDeaths } from './replace-death.js';
import { deathTriggers } from './death.js';

/** État après une action/effet + éventuelles morts directes -> résolution des morts.
 * Les IDs forcés désignent des unités à tuer sans dégâts (IDs absents ignorés).
 * Ils sont consommés une seule fois, même si Highlander remplace la mort.
 * Les autres morts exigent des dégâts non nuls >= Might actuelle.
 * Applique les rappels avant les morts, puis recommence si une aura disparue rend
 * d'autres blessures létales. Aucun soin global. Cimetières avant choix des effets ;
 * priorité des choix : attaquant/joueur actif puis ordre des joueurs. Le contrôle du
 * showdown actif est conservé. État de confiance, cimetière requis pour chaque carte. */
export function settleLethalUnits(
  input: GameState,
  destroyedIds: ReadonlySet<string> = new Set(),
): Extract<ActionResult, { ok: true }> {
  let state = input;
  const events: GameEvent[] = [];
  const triggers: DeathTrigger[] = [];
  let forced = destroyedIds;
  while (!state.result) {
    const lethal = state.units.filter(
      (u) =>
        forced.has(u.id) ||
        (u.damage > 0 && u.damage >= effectiveMight(u, state)),
    );
    forced = new Set();
    if (!lethal.length) break;
    const replaced = replaceDeaths(state, new Set(lethal.map((u) => u.id)));
    events.push(...replaced.events);
    const triggered = deathTriggers(state, replaced.dead);
    triggers.push(...triggered);
    events.push(
      ...triggered.map((t) => ({
        type: 'death-triggered' as const,
        sourceId: t.sourceId,
        playerId: t.ownerId,
      })),
    );
    const ids = new Set(replaced.dead.map((u) => u.id));
    const cards = [...state.cards];
    for (const unit of replaced.dead) {
      if (unit.token) {
        events.push({ type: 'token-removed', unitId: unit.id });
      } else {
        const grave = state.zones.find(
          (z) => z.kind === 'graveyard' && z.ownerId === unit.ownerId,
        );
        if (!grave) throw new Error('Cimetière absent pour une unité morte.');
        cards.push({
          id: unit.id,
          definitionId: unit.definitionId,
          ownerId: unit.ownerId,
          zoneId: grave.id,
        });
        events.push({ type: 'unit-died', unitId: unit.id, zoneId: grave.id });
      }
    }
    state = {
      ...state,
      cards,
      units: replaced.units.filter((u) => !ids.has(u.id)),
    };
    const combat = state.showdown;
    if (
      state.combatAftermath &&
      combat?.kind === 'combat' &&
      !state.units.some(
        (u) =>
          u.zoneId === combat.battlefieldId && u.ownerId === combat.defenderId,
      )
    )
      state = { ...state, combatAftermath: { defenderEliminated: true } };
  }
  if (state === input) return { ok: true, state, events };
  const first = state.showdown?.initiatorId ?? state.activePlayerId;
  const allTriggers = [...(state.pendingDeaths?.triggers ?? []), ...triggers];
  if (allTriggers.length)
    state = {
      ...state,
      pendingDeaths: {
        playerOrder: [
          first,
          ...state.players.map((p) => p.id).filter((id) => id !== first),
        ].filter((id) => allTriggers.some((t) => t.ownerId === id)),
        triggers: allTriggers,
      },
    };
  state = {
    ...state,
    battlefields: state.battlefields.map((f) =>
      f.zoneId !== state.showdown?.battlefieldId &&
      !state.units.some(
        (u) => u.ownerId === f.controllerId && u.zoneId === f.zoneId,
      )
        ? { ...f, controllerId: null }
        : f,
    ),
  };
  return { ok: true, state, events };
}
