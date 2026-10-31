import type { CardCost } from './unit-definition.js';
import { printedMetadata, type PrintedMetadata } from './printed-metadata.js';

/** Effet continu tant que le gear est en jeu, sans durée de fin de tour. */
export interface GearEffect {
  readonly type: 'might-bonus';
  readonly scope: 'allied-units' | 'attached-unit';
  readonly amount: number;
}

/** Gear non-unité. Coût de pose distinct du coût facultatif d'équipement.
 * Sans equipCost il ne peut pas s'attacher. Position, Ready et porteur sont des données d'instance. */
export interface GearDefinition extends PrintedMetadata {
  /** Capacité ADD « Tap : ajoute » ; énergie et/ou Power d'une couleur, sans pile. */
  readonly resourceAbility?: {
    readonly energy?: number;
    readonly power?: string;
  };
  /** Métadonnées d'affichage, jamais chargées par le moteur. */
  readonly imageUrl?: string;
  readonly text?: string;
  readonly id: string;
  readonly name: string;
  readonly type: 'gear';
  readonly cost: CardCost;
  readonly equipCost?: CardCost;
  readonly effects: readonly GearEffect[];
}

/** Définition -> copie figée indépendante. RangeError si coût négatif/non fini,
 * bonus non fini ou effet de porteur sans coût d'équipement. Aucun effet exécuté ici. */
export function defineGear(input: GearDefinition): GearDefinition {
  for (const cost of [
    input.cost,
    ...(input.equipCost ? [input.equipCost] : []),
  ]) {
    for (const value of [cost.energy, ...Object.values(cost.power)]) {
      if (!Number.isFinite(value) || value < 0)
        throw new RangeError(`${input.id}: coût invalide.`);
    }
  }
  for (const effect of input.effects) {
    if (!Number.isFinite(effect.amount))
      throw new RangeError(`${input.id}: bonus invalide.`);
    if (effect.scope === 'attached-unit' && !input.equipCost)
      throw new RangeError(`${input.id}: coût d'équipement absent.`);
  }
  const freezeCost = (cost: CardCost): CardCost =>
    Object.freeze({
      ...(cost.powerChoice
        ? { powerChoice: Object.freeze([...cost.powerChoice]) }
        : {}),
      ...(cost.powerChoiceAmount !== undefined
        ? { powerChoiceAmount: cost.powerChoiceAmount }
        : {}),
      energy: cost.energy,
      power: Object.freeze({ ...cost.power }),
    });
  return Object.freeze({
    ...printedMetadata(input.id),
    ...input,
    ...(input.resourceAbility
      ? { resourceAbility: Object.freeze({ ...input.resourceAbility }) }
      : {}),
    cost: freezeCost(input.cost),
    ...(input.equipCost ? { equipCost: freezeCost(input.equipCost) } : {}),
    effects: Object.freeze(
      input.effects.map((effect) => Object.freeze({ ...effect })),
    ),
  });
}
