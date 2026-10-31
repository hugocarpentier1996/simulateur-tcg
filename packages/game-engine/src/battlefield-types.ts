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
  /** Conquête : le conquérant défausse 1 puis pioche 1, via la pile. */
  readonly conquerLoot?: boolean;
  /** Conquête : le conquérant redressera ce nombre de runes à la fin du tour. */
  readonly conquerEndTurnReadyRunes?: number;
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
