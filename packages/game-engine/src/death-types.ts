/** Effet Deathknell déclenché à la mort d'une unité. Seul summon-token demande une
 * destination ; les autres s'appliquent au propriétaire ou à la zone de la mort. */
export type DeathEffect =
  | { readonly type: 'summon-token'; readonly definitionId: string }
  | { readonly type: 'draw'; readonly count: number }
  /** Canaliser des runes Tap, puis piocher `draw` cartes si indiqué. */
  | {
      readonly type: 'channel-exhausted';
      readonly count: number;
      readonly draw?: number;
    }
  /** Jetons joués dans la base du propriétaire, sans choix de destination. */
  | {
      readonly type: 'summon-tokens-base';
      readonly definitionId: string;
      readonly count: number;
    }
  /** Dégâts de capacité à toutes les unités du champ où l'unité est morte ; rien en base. */
  | { readonly type: 'damage-here'; readonly amount: number };
export interface DeathTrigger {
  sourceId: string;
  ownerId: string;
  effect: DeathEffect;
  /** Zone où l'unité est morte. */
  zoneId?: string;
}
/** Entrée de pile indépendante de la carte source, déjà au cimetière. */
export interface DeathEntry extends DeathTrigger {
  kind: 'death';
  destinationId: string;
}
/** Seule l'invocation d'un jeton choisit une destination. */
export function deathNeedsDestination(effect: DeathEffect): boolean {
  return effect.type === 'summon-token';
}
