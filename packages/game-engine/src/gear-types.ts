import type { UnitBlueprint } from './types.js';

/** Catalogue de confiance compatible avec game-data. Pas de dégâts ni de Might propre.
 * equipCost absent : gear non équipable. Les exceptions gear-unité restent à ajouter. */
export interface GearBlueprint {
  readonly id: string;
  readonly type: 'gear';
  readonly cost: UnitBlueprint['cost'];
  readonly equipCost?: UnitBlueprint['cost'];
  readonly effects: readonly {
    readonly type: 'might-bonus';
    readonly scope: 'allied-units' | 'attached-unit';
    readonly amount: number;
  }[];
}

/** Permanent en jeu, absent de cards et units. L'attachement suit la zone du porteur.
 * Sans porteur : en base. Aucun déplacement autonome ni dégât dans cette tranche. */
export interface GearState {
  id: string;
  definitionId: string;
  ownerId: string;
  zoneId: string;
  ready: boolean;
  attachedUnitId?: string;
}
