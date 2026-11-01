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
  /** Tenue : déclenche les effets de conquête (onConquerDraw) des unités alliées présentes. */
  readonly holdActivatesConquer?: boolean;
  /** Cartes Hidden supplémentaires pouvant être cachées ici (Bandle Tree). */
  readonly extraHiddenSlots?: number;
  /** Conquête : le conquérant défausse 1 puis pioche 1, via la pile. */
  readonly conquerLoot?: boolean;
  /** Conquête : dépenser un buff allié pour piocher 1 (automatique si possible), via la pile. */
  readonly conquerSpendBuffDraw?: boolean;
  /** Premier choix du tour d'une unité alliée présente ici par un sort : pioche 1 (sans pile). */
  readonly drawOnFirstFriendlySpellChoice?: boolean;
  /** Conquête : le conquérant recycle une de ses runes (Tap d'abord), via la pile. */
  readonly conquerRecycleRune?: boolean;
  /** Tenue : buffe une unité alliée ici (sans buff de préférence, sans choix), via la pile. */
  readonly holdBuffHere?: boolean;
  /** Début de la première Beginning de chaque joueur : 1 point (The Arena's Greatest) ou
   * 1 rune canalisée (Obelisk of Power). */
  readonly firstBeginning?: 'point' | 'channel';
  /** Tenue avec au moins ce nombre d'unités alliées ici : victoire immédiate. */
  readonly holdWinUnits?: number;
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
