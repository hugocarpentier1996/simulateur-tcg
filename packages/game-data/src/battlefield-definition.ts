import { printedMetadata, type PrintedMetadata } from './printed-metadata.js';
/** Champ permanent : sans coût ni Might. Ses effets s'appliquent au lieu désigné par son instance. */
export interface BattlefieldDefinition extends PrintedMetadata {
  readonly id: string;
  readonly name: string;
  readonly type: 'battlefield';
  readonly text: string;
  readonly imageUrl: string;
  readonly unitMightBonus?: number;
  readonly effectDamageBonus?: number;
  readonly defenseShield?: number;
  readonly holdChannel?: number;
  /** Tenue : son contrôleur pioche ce nombre de cartes via la pile. */
  readonly holdDraw?: number;
  /** Conquête : le conquérant défausse 1 puis pioche 1, via la pile. */
  readonly conquerLoot?: boolean;
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
/** Définition de confiance -> copie immuable, indépendante de son contrôleur. */
export function defineBattlefield(
  input: BattlefieldDefinition,
): BattlefieldDefinition {
  return Object.freeze({ ...printedMetadata(input.id), ...input });
}
