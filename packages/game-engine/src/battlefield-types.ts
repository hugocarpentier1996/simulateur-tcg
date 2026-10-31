/** Catalogue de confiance des champs. L'instance référence la définition via definitionId. */
export interface BattlefieldBlueprint {
  readonly id: string;
  readonly type: 'battlefield';
  readonly unitMightBonus?: number;
  readonly effectDamageBonus?: number;
  readonly defenseShield?: number;
  readonly holdChannel?: number;
  /** Les unités présentes ont Ganking (Windswept Hillock). */
  readonly grantsGanking?: boolean;
  /** Les unités ne peuvent pas se déplacer d'ici vers une base (Vilemaw's Lair). */
  readonly noMoveToBase?: boolean;
}
