/** Légende constante en zone dédiée ; pas d'attributs de combat ou de coût de pose. */
export interface LegendDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: 'legend';
  readonly colors: readonly string[];
  readonly text: string;
  readonly imageUrl: string;
  readonly aloneDefenseBonus?: number;
  readonly conquestDraw?: {
    readonly minimumUnits: number;
    readonly count: number;
  };
  readonly spellDraw?: {
    readonly minimumEnergy: number;
    readonly count: number;
  };
}
/** Définition de confiance -> copie figée, dont les couleurs. */
export function defineLegend(input: LegendDefinition): LegendDefinition {
  return Object.freeze({
    ...input,
    ...(input.conquestDraw
      ? { conquestDraw: Object.freeze({ ...input.conquestDraw }) }
      : {}),
    ...(input.spellDraw
      ? { spellDraw: Object.freeze({ ...input.spellDraw }) }
      : {}),
    colors: Object.freeze([...input.colors]),
  });
}
