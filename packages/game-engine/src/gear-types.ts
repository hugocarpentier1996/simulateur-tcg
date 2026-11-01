import type { UnitBlueprint } from './types.js';

/** Catalogue de confiance compatible avec game-data. Pas de dégâts ni de Might propre.
 * equipCost absent : gear non équipable. Les exceptions gear-unité restent à ajouter. */
export interface GearBlueprint {
  readonly id: string;
  readonly type: 'gear';
  readonly cost: UnitBlueprint['cost'];
  readonly equipCost?: UnitBlueprint['cost'];
  /** Capacité ADD « Tap : ajoute » : énergie et/ou Power d'une couleur, sans pile. */
  readonly resourceAbility?: {
    readonly energy?: number;
    readonly power?: string;
  };
  /** Le gear entre en jeu Tap. */
  readonly entersExhausted?: boolean;
  /** Capacité « Tap : effet » sur une unité ciblée, via la pile, à son tour hors Showdown.
   * exhausted : la cible doit être Tap. move-to-base : unité alliée d'un champ vers sa base. */
  readonly tapAbility?: {
    readonly cost?: UnitBlueprint['cost'];
    readonly target: {
      readonly allegiance?: 'friendly' | 'enemy';
      readonly zone?: 'battlefield';
      readonly exhausted?: boolean;
    };
    readonly effect:
      | { readonly type: 'damage'; readonly amount: number }
      | {
          readonly type: 'modify-might';
          readonly amount: number;
          readonly minimum?: number;
        }
      | { readonly type: 'buff' }
      | { readonly type: 'grant-ganking' }
      | { readonly type: 'move-to-base' }
      /** Sans cible : jeton de cette définition dans la base du propriétaire. */
      | { readonly type: 'summon-base'; readonly definitionId: string };
  };
  /** Posé, défaussé ou détruit : son propriétaire pioche 1 (Scrapheap ; sans pile). */
  readonly drawOnPlayDiscardOrKill?: boolean;
  readonly effects: readonly {
    readonly type: 'might-bonus';
    /** alone-in-combat : unité alliée seule de son camp au combat (Mask of Foresight). */
    readonly scope: 'allied-units' | 'attached-unit' | 'alone-in-combat';
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
