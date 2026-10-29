/** Champ permanent : sans coût ni Might. Ses effets s'appliquent au lieu désigné par son instance. */
export interface BattlefieldDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: 'battlefield';
  readonly text: string;
  readonly imageUrl: string;
  readonly unitMightBonus?: number;
  readonly effectDamageBonus?: number;
  readonly defenseShield?: number;
  readonly holdChannel?: number;
}
/** Définition de confiance -> copie immuable, indépendante de son contrôleur. */
export function defineBattlefield(
  input: BattlefieldDefinition,
): BattlefieldDefinition {
  return Object.freeze({ ...input });
}
