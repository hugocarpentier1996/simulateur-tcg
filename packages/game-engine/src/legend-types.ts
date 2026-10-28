/** Catalogue de légendes permanentes : ni coût de pose, ni Might, ni dégâts.
 * L'instance reste dans cards, en zone legend, avec son Ready/Tap indépendant du passif. */
export interface LegendBlueprint {
  readonly id: string;
  readonly type: 'legend';
  readonly aloneDefenseBonus?: number;
  readonly spellDraw?: {
    readonly minimumEnergy: number;
    readonly count: number;
  };
}

/** Déclenchement de pioche indépendant de la source, après une fenêtre de réaction. */
export interface LegendEntry {
  kind: 'legend-draw';
  sourceId: string;
  ownerId: string;
  count: number;
}
