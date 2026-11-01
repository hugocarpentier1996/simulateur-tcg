import type { GearTapAbility } from './gear-definition.js';
import { printedMetadata, type PrintedMetadata } from './printed-metadata.js';
/** Légende constante en zone dédiée ; pas d'attributs de combat ou de coût de pose. */
export interface LegendDefinition extends PrintedMetadata {
  readonly id: string;
  readonly name: string;
  readonly type: 'legend';
  readonly colors: readonly string[];
  readonly text: string;
  readonly imageUrl: string;
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
  readonly tapAbility?: GearTapAbility;
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
/** Définition de confiance -> copie figée, dont les couleurs. */
export function defineLegend(input: LegendDefinition): LegendDefinition {
  return Object.freeze({
    ...printedMetadata(input.id),
    ...input,
    ...(input.tags ? { tags: Object.freeze([...input.tags]) } : {}),
    ...(input.conquestDraw
      ? { conquestDraw: Object.freeze({ ...input.conquestDraw }) }
      : {}),
    ...(input.spellDraw
      ? { spellDraw: Object.freeze({ ...input.spellDraw }) }
      : {}),
    colors: Object.freeze([...input.colors]),
  });
}
