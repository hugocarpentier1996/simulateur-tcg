import type { ActionResult, GameState } from '../types.js';
import { dealAreaDamage } from './area-damage.js';
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
  const damaged = dealAreaDamage(
    state,
    { kind: 'ability', sourceId: entry.sourceId, playerId: entry.ownerId },
    state.battlefields.map((f) => ({
      kind: 'battlefield',
      battlefieldId: f.zoneId,
    })),
    entry.amount,
  );
  const settled = settleLethalUnits(damaged.state);
  return {
    ok: true,
    state: settled.state,
    events: [
      ...damaged.events,
      ...settled.events,
      { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
    ],
  };
}
