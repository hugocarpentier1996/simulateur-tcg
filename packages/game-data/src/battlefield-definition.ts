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
