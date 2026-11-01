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
  /** Ennemi Stun tué : le gear Ready se couche et son propriétaire pioche 1 (sans pile). */
  readonly drawOnStunnedEnemyKill?: boolean;
  /** Le gear entre en jeu Tap. */
  readonly entersExhausted?: boolean;
  /** Capacité « Tap : effet » sur une unité ciblée, via la pile, à son tour hors Showdown.
   * exhausted : la cible doit être Tap. move-to-base : unité alliée d'un champ vers sa base. */
  readonly tapAbility?: {
    readonly cost?: UnitBlueprint['cost'];
    /** Unité source : capacité utilisable seulement si elle est sur un champ. */
    readonly requiresBattlefield?: boolean;
    /** Capacité sans Tap (le gear reste Ready ; utilisable même Tap). */
    readonly noExhaust?: boolean;
    /** Coût : détruire le gear source (« Kill this: »). */
    readonly killSelfCost?: boolean;
    /** Coût supplémentaire : recycler ce nombre de cartes de son cimetière (les plus anciennes,
     * hypothèse) sous son deck. */
    readonly recycleTrash?: number;
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
      /** Dégâts égaux à la Might actuelle de la source (unité). */
      | { readonly type: 'might-damage' }
      | { readonly type: 'move-to-base' }
      /** Sans cible : jeton de cette définition dans la base du propriétaire. */
      | { readonly type: 'summon-base'; readonly definitionId: string }
      /** Sans cible : le gear source se détruit (Treasure Trove). */
      | { readonly type: 'kill-self' }
      /** Sans cible : son propriétaire pioche count cartes. */
      | { readonly type: 'draw'; readonly count: number }
      /** Sans cible : la prochaine unité jouée ce tour arrive Ready ; legion : seulement si une
       * carte a déjà été jouée ce tour (vérifié à la résolution). */
      | { readonly type: 'next-unit-ready'; readonly legion?: boolean }
      /** Sans cible : le prochain sort joué ce tour inflige `amount` dégâts bonus par instance. */
      | { readonly type: 'next-spell-bonus-damage'; readonly amount: number }
      /** Sans cible : recycle jusqu'à `count` cartes des cimetières, choisies une à une. */
      | { readonly type: 'recycle-trashes'; readonly count: number }
      /** Renvoie en main une unité, un autre gear ou une carte cachée alliés (Pack of Wonders). */
      | { readonly type: 'bounce-friendly' }
      /** Met en main une unité à soi portant ce tag, depuis la zone champion ou le plateau. */
      | { readonly type: 'tag-to-hand'; readonly tag: string }
      /** Unité alliée : d'un champ vers sa base, ou de sa base vers le champ destinationId. */
      | { readonly type: 'move-to-or-from-base' };
  };
  /** Posé, défaussé ou détruit : son propriétaire pioche 1 (Scrapheap ; sans pile). */
  readonly drawOnPlayDiscardOrKill?: boolean;
  /** Quitte le terrain (détruit) : son propriétaire pioche 1 puis canalise 1 rune Tap
   * (Treasure Trove ; sans pile, comme Scrapheap). */
  readonly onLeaveDrawChannel?: boolean;
  /** Une unité alliée redressée par un effet (hors Awaken) gagne cette Might ce tour
   * (Pirate's Haven ; sans pile). */
  readonly mightOnAllyReadied?: number;
  /** Posé : buffe l'unité alliée choisie (targetId de play-gear, sans pile). */
  readonly onPlayBuffAlly?: boolean;
  /** La prochaine fois qu'une unité alliée devrait mourir : ce gear est détruit à la place
   * et l'unité est rappelée Tap dans sa base (Zhonya's Hourglass). */
  readonly saveAllyFromDeath?: boolean;
  /** Hidden : peut être caché pour 1 Power puis posé gratuitement plus tard. */
  readonly hidden?: boolean;
  /** Posé : jeton de cette définition dans la base du propriétaire (sans pile). */
  readonly onPlaySummonBase?: string;
  /** Les unités alliées buffées ont Deflect (Spirit's Refuge). */
  readonly buffedAlliesDeflect?: boolean;
  /** Une unité alliée Tap vient d'être buffée : payer 1 Power de cette couleur et coucher
   * le gear pour la redresser (Mistfall ; automatique si possible, sans pile). */
  readonly readyOnAllyBuffed?: { readonly power: string };
  /** Une unité alliée buffée meurt : une autre unité alliée (sans buff d'abord) est buffée
   * (Vanguard Helm ; sans pile). */
  readonly buffOnBuffedAllyDeath?: boolean;
  /** Début de la Beginning de son propriétaire : pioche 1 (pile) s'il contrôle une carte
   * cachée sur un champ (Mushroom Pouch). */
  readonly beginningDrawIfFacedown?: boolean;
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
  /** Temporary : détruit au début de la Beginning de son propriétaire, avant le score. */
  temporary?: boolean;
}
