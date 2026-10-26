/** Première capacité déclenchée : invoquer une définition de jeton du catalogue. */
export interface DeathEffect {
  readonly type: 'summon-token';
  readonly definitionId: string;
}
export interface DeathTrigger {
  sourceId: string;
  ownerId: string;
  effect: DeathEffect;
}
/** Entrée de pile indépendante de la carte source, déjà au cimetière. */
export interface DeathEntry extends DeathTrigger {
  kind: 'death';
  destinationId: string;
}
