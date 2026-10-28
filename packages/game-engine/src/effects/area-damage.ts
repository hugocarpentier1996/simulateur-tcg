import type { ActionResult, GameState } from '../types.js';
import {
  unitsInBattlefieldAreas,
  type BattlefieldArea,
} from '../battlefield-areas.js';
import { spellAbilityDamageBonus } from './damage-bonus.js';
import { dealSpellDamage } from './spell-damage.js';

/** Source conservée indépendamment de la portée ; combat et duel ne passent pas ici. */
export type AreaDamageSource =
  | { kind: 'spell'; cardId: string; playerId: string }
  | { kind: 'ability'; sourceId: string; playerId: string };

/** État + source + union de champs/côtés + dégâts de base -> dégâts simultanés.
 * Une unité n'est touchée qu'une fois, même si les portées se recouvrent. Bonus avant
 * toute mort ; pas de soin, score ni traitement des morts ici (responsabilité de l'appelant).
 * Montant négatif/non fini : RangeError. Zones disparues ignorées, entrée préservée. */
export function dealAreaDamage(
  state: GameState,
  source: AreaDamageSource,
  areas: readonly BattlefieldArea[],
  baseAmount: number,
): Extract<ActionResult, { ok: true }> {
  if (!Number.isFinite(baseAmount) || baseAmount < 0)
    throw new RangeError('Dégâts de zone invalides.');
  const targets = unitsInBattlefieldAreas(state, areas);
  if (source.kind === 'spell')
    return dealSpellDamage(
      state,
      source.cardId,
      source.playerId,
      targets,
      baseAmount,
    );
  const amount = baseAmount + spellAbilityDamageBonus(state, source.playerId);
  const ids = new Set(targets.map((u) => u.id));
  return {
    ok: true,
    state: {
      ...state,
      units: state.units.map((u) =>
        ids.has(u.id) ? { ...u, damage: u.damage + amount } : u,
      ),
    },
    events: targets.map((u) => ({
      type: 'ability-damage',
      sourceId: source.sourceId,
      unitId: u.id,
      amount,
    })),
  };
}
