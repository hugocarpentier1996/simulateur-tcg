import type { GearBlueprint } from './gear-types.js';
/** Catalogue de légendes permanentes : ni coût de pose, ni Might, ni dégâts.
 * L'instance reste dans cards, en zone legend, avec son Ready/Tap indépendant du passif. */
export interface LegendBlueprint {
  readonly id: string;
  readonly type: 'legend';
  readonly aloneDefenseBonus?: number;
  readonly readyRunesAtEnd?: number;
  readonly conquestDraw?: {
    readonly minimumUnits: number;
    readonly count: number;
  };
  readonly spellDraw?: {
    readonly minimumEnergy: number;
    readonly count: number;
  };
  /** Capacité « Tap : effet » ciblée, comme celle des gears (action activate-gear). */
  readonly tapAbility?: GearBlueprint['tapAbility'];
  /** Attaque ennemie d'un champ qu'il contrôle : -N Might ce tour aux attaquants, minimum 1. */
  readonly weakenAttackers?: number;
  /** Unité Mighty jouée : la légende Ready se couche pour canaliser N runes Tap (pile). */
  readonly mightyPlayChannel?: number;
  /** Étourdir des ennemis : buffe une unité alliée (sans buff d'abord, sans choix ni pile). */
  readonly buffOnEnemyStunned?: boolean;
  /** Début de sa Beginning : pioche 1 (via la pile) si sa main a au plus ce nombre de cartes. */
  readonly beginningDrawIfHandAtMost?: number;
  /** Cacher une carte peut se payer 1 énergie au lieu d'1 Power (Swift Scout). */
  readonly hideWithEnergy?: boolean;
  /** Unité buffée alliée qui devrait mourir : 1 Power + légende couchée -> buff dépensé et
   * rappel Tap en base à la place (The Boss ; accepté automatiquement si possible). */
  readonly saveBuffedFromDeath?: boolean;
  /** Quand son propriétaire conquiert, la légende se redresse. */
  readonly readyOnConquer?: boolean;
  /** Capacité ADD « Tap : ajoute » ; legion : seulement si une carte a été jouée ce tour. */
  readonly resourceAbility?: {
    readonly energy?: number;
    readonly power?: string;
    readonly legion?: boolean;
    /** Power de n'importe quel domaine réservé aux sorts. */
    readonly spellPower?: number;
  };
}

/** Déclenchement de pioche indépendant de la source, après une fenêtre de réaction. */
export interface LegendEntry {
  kind: 'legend-draw';
  battlefieldCondition?: { battlefieldId: string; minimumUnits: number };
  sourceId: string;
  ownerId: string;
  count: number;
}

/** Choix copié à la fin de tour, avant les réactions. */
export interface ReadyRunesEntry {
  kind: 'legend-ready-runes';
  sourceId: string;
  ownerId: string;
  runeIds: readonly string[];
}
