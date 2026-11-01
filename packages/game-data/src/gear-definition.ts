import type { CardCost } from './unit-definition.js';
import { printedMetadata, type PrintedMetadata } from './printed-metadata.js';

/** Effet continu tant que le gear est en jeu, sans durée de fin de tour. */
export interface GearEffect {
  readonly type: 'might-bonus';
  /** alone-in-combat : unité alliée seule de son camp au combat (Mask of Foresight). */
  readonly scope: 'allied-units' | 'attached-unit' | 'alone-in-combat';
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
  /** Posé, défaussé ou détruit : son propriétaire pioche 1 (Scrapheap ; sans pile). */
  readonly drawOnPlayDiscardOrKill?: boolean;
  /** Ennemi Stun tué : le gear Ready se couche et son propriétaire pioche 1 (sans pile). */
  readonly drawOnStunnedEnemyKill?: boolean;
  /** Le gear entre en jeu Tap. */
  readonly entersExhausted?: boolean;
  /** Capacité « Tap : effet » sur une unité ciblée, via la pile, à son tour hors Showdown. */
  readonly tapAbility?: GearTapAbility;
}

/** Cible et effet d'une capacité Tap de gear (même vocabulaire que les effets de mise en jeu). */
export interface GearTapAbility {
  readonly cost?: CardCost;
  /** Unité source : capacité utilisable seulement si elle est sur un champ. */
  readonly requiresBattlefield?: boolean;
  readonly target: {
    readonly allegiance?: 'friendly' | 'enemy';
    readonly zone?: 'battlefield';
    readonly exhausted?: boolean;
  };
  readonly effect:
    | { readonly type: 'damage'; readonly amount: number }
    | {
        readonly type: 'modify-might';
        readonly amount: number;
        readonly minimum?: number;
      }
    | { readonly type: 'buff' }
    | { readonly type: 'grant-ganking' }
    /** Dégâts égaux à la Might actuelle de la source (unité). */
    | { readonly type: 'might-damage' }
    | { readonly type: 'move-to-base' }
    /** Sans cible : jeton de cette définition dans la base du propriétaire. */
    | { readonly type: 'summon-base'; readonly definitionId: string };
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
