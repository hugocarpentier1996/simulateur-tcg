/** Catalogue de légendes permanentes : ni coût de pose, ni Might, ni dégâts.
 * L'instance reste dans cards, en zone legend, avec son Ready/Tap indépendant du passif. */
export interface LegendBlueprint {
  readonly id: string;
  readonly type: 'legend';
  readonly aloneDefenseBonus?: number;
}
