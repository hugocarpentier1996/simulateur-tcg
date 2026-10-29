import type { ActionResult, GameState } from '../types.js';
import {
  unitsInBattlefieldAreas,
  type BattlefieldArea,
} from '../battlefield-areas.js';
import { dealEffectDamage } from './effect-damage.js';

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
  return dealEffectDamage(state, source, targets, baseAmount);
}
