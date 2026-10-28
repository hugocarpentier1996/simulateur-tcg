import type { ActionResult, GameState } from '../types.js';
import { spellAbilityDamageBonus } from './damage-bonus.js';
import { settleLethalUnits } from './lethal-units.js';

/** Capacité de Tibbers : indépendante de sa source après déclenchement, sans cible choisie. */
export interface UnitPlayEntry {
  kind: 'unit-play';
  sourceId: string;
  ownerId: string;
  amount: number;
}

/** Capacité payée/empilée -> dégâts simultanés aux unités actuellement sur les champs.
 * Inclut alliés, ennemis et source ; exclut les bases. Bonus du propriétaire calculé
 * avant les morts. Traite ensuite les morts et leurs choix, sans soin ni score. */
export function resolveUnitPlay(
  state: GameState,
  entry: UnitPlayEntry,
): Extract<ActionResult, { ok: true }> {
  const amount = entry.amount + spellAbilityDamageBonus(state, entry.ownerId);
  const targets = state.units.filter((u) =>
    state.zones.some((z) => z.id === u.zoneId && z.kind === 'battlefield'),
  );
  const ids = new Set(targets.map((u) => u.id));
  const settled = settleLethalUnits({
    ...state,
    units: state.units.map((u) =>
      ids.has(u.id) ? { ...u, damage: u.damage + amount } : u,
    ),
  });
  return {
    ok: true,
    state: settled.state,
    events: [
      ...targets.map((u) => ({
        type: 'ability-damage' as const,
        sourceId: entry.sourceId,
        unitId: u.id,
        amount,
      })),
      ...settled.events,
      { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
    ],
  };
}
