import type { GearTapAbility } from './gear-definition.js';
import { printedMetadata, type PrintedMetadata } from './printed-metadata.js';
/** Légende constante en zone dédiée ; pas d'attributs de combat ou de coût de pose. */
export interface LegendDefinition extends PrintedMetadata {
  readonly id: string;
  readonly name: string;
  readonly type: 'legend';
  readonly colors: readonly string[];
  readonly text: string;
  readonly imageUrl: string;
  readonly aloneDefenseBonus?: number;
  readonly readyRunesAtEnd?: number;
  readonly conquestDraw?: {
    readonly minimumUnits: number;
    readonly count: number;
  };
  readonly spellDraw?: {
    readonly minimumEnergy: number;
    readonly count: number;
  };
  /** Capacité « Tap : effet » ciblée, comme celle des gears (action activate-gear). */
  readonly tapAbility?: GearTapAbility;
  /** Début de sa Beginning : pioche 1 (via la pile) si sa main a au plus ce nombre de cartes. */
  readonly beginningDrawIfHandAtMost?: number;
  /** Capacité ADD « Tap : ajoute » ; legion : seulement si une carte a été jouée ce tour. */
  readonly resourceAbility?: {
    readonly energy?: number;
    readonly power?: string;
    readonly legion?: boolean;
  };
}
/** Définition de confiance -> copie figée, dont les couleurs. */
export function defineLegend(input: LegendDefinition): LegendDefinition {
  return Object.freeze({
    ...printedMetadata(input.id),
    ...input,
    ...(input.tags ? { tags: Object.freeze([...input.tags]) } : {}),
    ...(input.conquestDraw
      ? { conquestDraw: Object.freeze({ ...input.conquestDraw }) }
      : {}),
    ...(input.spellDraw
      ? { spellDraw: Object.freeze({ ...input.spellDraw }) }
      : {}),
    colors: Object.freeze([...input.colors]),
  });
}
