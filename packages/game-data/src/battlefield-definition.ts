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
  /** Les unités présentes ont Ganking (Windswept Hillock). */
  readonly grantsGanking?: boolean;
  /** Les unités ne peuvent pas se déplacer d'ici vers une base (Vilemaw's Lair). */
  readonly noMoveToBase?: boolean;
}
/** Définition de confiance -> copie immuable, indépendante de son contrôleur. */
export function defineBattlefield(
  input: BattlefieldDefinition,
): BattlefieldDefinition {
  return Object.freeze({ ...printedMetadata(input.id), ...input });
}
