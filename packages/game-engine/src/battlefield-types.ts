/** Catalogue de confiance des champs. L'instance référence la définition via definitionId. */
export interface BattlefieldBlueprint {
  readonly id: string;
  readonly type: 'battlefield';
  readonly unitMightBonus?: number;
  readonly effectDamageBonus?: number;
  readonly defenseShield?: number;
  readonly holdChannel?: number;
  /** Tenue : son contrôleur pioche ce nombre de cartes via la pile. */
  readonly holdDraw?: number;
  /** Points supplémentaires nécessaires pour gagner tant qu'il est en jeu. */
  readonly victoryTargetBonus?: number;
  /** Tenue : jeton de cette définition joué dans la base du contrôleur, via la pile. */
  readonly holdSummonBase?: string;
  /** Les unités présentes ont Ganking (Windswept Hillock). */
  readonly grantsGanking?: boolean;
  /** Les unités ne peuvent pas se déplacer d'ici vers une base (Vilemaw's Lair). */
  readonly noMoveToBase?: boolean;
  /** Bonus de Might jusqu'à la fin du tour pour une unité qui se déplace d'ici. */
  readonly moveOutMightBonus?: number;
}
