import {
  act,
  type DamageAllocation,
  type GameState,
} from '../../../packages/game-engine/src/index.js';
import {
  canTarget,
  combatPower,
  lethalDamage,
} from '../../../packages/game-engine/src/combat/allocation.js';

/** Joueur qui doit répartir ses dégâts de combat maintenant (premier participant sans
 * répartition), ou null hors de l'étape des dégâts. */
export function damageAssigner(state: GameState): string | null {
  const combat = state.showdown;
  if (
    combat?.kind !== 'combat' ||
    combat.stage !== 'damage' ||
    state.stack ||
    state.pendingModeChoice
  )
    return null;
  return combat.participants.find((id) => !combat.assignments[id]) ?? null;
}

export interface DamagePlan {
  playerId: string;
  battlefieldId: string;
  /** Dégâts totaux à infliger par ce joueur. */
  power: number;
  allocations: DamageAllocation[];
  remaining: number;
  /** Unités cliquables maintenant (Tank / Backline respectés). */
  next: string[];
  /** Répartition acceptée par le moteur : le bouton Valider est actif. */
  valid: boolean;
}

/** Clics successifs -> répartition : chaque cible reçoit de quoi mourir, ou tout ce qui
 * reste si ce n'est pas assez (elle est alors la dernière). Clics invalides ignorés. */
export function damagePlan(
  state: GameState,
  playerId: string,
  picks: readonly string[],
): DamagePlan | null {
  const combat = state.showdown;
  if (combat?.kind !== 'combat') return null;
  const present = state.units.filter((u) => u.zoneId === combat.battlefieldId);
  const power = combatPower(
    present.filter((u) => u.ownerId === playerId),
    state,
  );
  const available = new Map(
    present.filter((u) => u.ownerId !== playerId).map((u) => [u.id, u]),
  );
  const allocations: DamageAllocation[] = [];
  let remaining = power;
  let partial = false;
  for (const id of picks) {
    const target = available.get(id);
    if (!target || remaining <= 0 || partial) continue;
    if (!canTarget(target, [...available.values()])) continue;
    const lethal = lethalDamage(target, state);
    const amount = Math.min(remaining, lethal);
    if (amount <= 0) continue;
    allocations.push({ targetId: id, amount });
    remaining -= amount;
    partial = amount < lethal;
    available.delete(id);
  }
  const next =
    remaining > 0 && !partial
      ? [...available.values()]
          .filter((u) => canTarget(u, [...available.values()]))
          .map((u) => u.id)
      : [];
  const valid = act(state, {
    type: 'assign-damage',
    playerId,
    allocations,
  }).ok;
  return {
    playerId,
    battlefieldId: combat.battlefieldId,
    power,
    allocations,
    remaining,
    next,
    valid,
  };
}

/** Clic sur une unité : ajoutée à la suite, ou retirée avec les suivantes si déjà choisie. */
export function toggleDamagePick(
  picks: readonly string[],
  id: string,
): string[] {
  const index = picks.indexOf(id);
  return index >= 0 ? picks.slice(0, index) : [...picks, id];
}
