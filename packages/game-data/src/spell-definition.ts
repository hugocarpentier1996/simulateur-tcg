import { printedMetadata, type PrintedMetadata } from './printed-metadata.js';
import type { CardCost } from './unit-definition.js';

/** Timing du lancement : les trois ouvrent une fenêtre de Réaction.
 * Normal : notre Main. Action : aussi notre priorité en open state de Showdown.
 * Réaction : mêmes fenêtres, plus réponse en closed state, y compris à une Réaction. */
export type SpellTiming = 'normal' | 'action' | 'reaction';

/** Effets déclaratifs, dans l'ordre de résolution. Les effets d'unité concernent la
 * cible choisie ; draw concerne le lanceur. Fin de tour = tour courant, pas prochain
 * tour du propriétaire. Un déplacement par effet conserve l'état Ready/Tap existant. */
export type SpellEffect =
  | {
      readonly type: 'summon-recruits';
      readonly definitionId: string;
      readonly count: number;
    }
  | {
      readonly type: 'boost-selected-allies';
      readonly count: 2;
      readonly amount: number;
      readonly duration: 'end-of-turn';
    }
  | { readonly type: 'move-up-to-two-allies-to-base' }
  | {
      readonly type: 'boost-allies';
      readonly amount: number;
      readonly duration: 'end-of-turn';
    }
  | { readonly type: 'damage-enemies-at-battlefield'; readonly amount: number }
  | { readonly type: 'damage-enemies-in-combat'; readonly amount: number }
  /** Dégâts de sort à toutes les unités sur tous les champs (alliées comprises). */
  | { readonly type: 'damage-all-at-battlefields'; readonly amount: number }
  /** Épuise toutes les unités alliées du lanceur. */
  | { readonly type: 'exhaust-allies' }
  /** Redresse l'unité ciblée (après un éventuel déplacement du même sort). */
  | { readonly type: 'ready-unit' }
  /** Assault temporaire (+amount en attaque) jusqu'à la fin du tour. */
  | {
      readonly type: 'grant-assault';
      readonly amount: number;
      readonly duration: 'end-of-turn';
    }
  | { readonly type: 'return-graveyard-unit' }
  | {
      readonly type: 'channel-exhausted';
      readonly count: number;
      /** Pioche 1 si moins de `count` runes ont pu être canalisées. */
      readonly drawIfShort?: boolean;
    }
  | { readonly type: 'units-enter-ready' }
  | {
      readonly type: 'damage-selected-units';
      readonly maximum: 2;
      readonly amount: number;
    }
  | { readonly type: 'return-unit-to-hand' }
  | { readonly type: 'kill-unit' }
  | { readonly type: 'duel' }
  | {
      readonly type: 'damage';
      readonly drawIfKilled?: number;
      readonly amount: number;
    }
  | { readonly type: 'recall-on-death'; readonly duration: 'end-of-turn' }
  | {
      readonly type: 'move-unit';
      readonly requiresReady: false;
      readonly exhaustsUnit: false;
    }
  | {
      readonly type: 'modify-might';
      /** Bonus supplémentaire si aucune autre unité alliée n'est dans cette zone à la résolution. */
      readonly aloneBonus?: number;
      /** Limite de cette réduction au moment de sa résolution, sans relever une Might déjà inférieure. */
      readonly minimum?: number;
      readonly amount: number;
      readonly duration: 'end-of-turn';
    }
  | {
      readonly type: 'draw';
      readonly countIfExhausted?: number;
      readonly count: number;
      readonly player: 'caster';
    }
  | { readonly type: 'stun'; readonly duration: 'end-of-turn' };

/** Données imprimées du sort, sans Might. Coût payé au lancement, effets à la résolution.
 * combatRole attacker désigne une unité du camp attaquant sur le champ du combat actif,
 * jamais un défenseur ni une autre unité du joueur attaquant restée dans sa base.
 * Le déplacement demandera également une destination légale au moteur. */
export interface SpellDefinition extends PrintedMetadata {
  readonly text?: string;
  readonly imageUrl?: string;
  readonly id: string;
  readonly name: string;
  readonly type: 'spell';
  readonly optionalExhaustAlly?: boolean;
  readonly timing: SpellTiming;
  readonly cost: CardCost;
  readonly target:
    | { readonly kind: 'graveyard-unit' }
    | { readonly kind: 'caster' }
    | { readonly kind: 'battlefield' }
    | {
        readonly zone?: 'battlefield';
        readonly maximumMight?: number;
        /** Absent : toute unité ; friendly : unité du lanceur, revérifiée à la résolution. */
        readonly allegiance?: 'friendly';
        readonly kind: 'unit';
        readonly combatRole: 'any' | 'attacker';
      };
  readonly effects: readonly SpellEffect[];
}

/** Entrée : définition de sort. Sortie : copie figée des données et effets.
 * RangeError pour un coût invalide, un modificateur non fini, une quantité de pioche
 * non entière/positive ou une liste d'effets vide. N'exécute aucune règle en partie. */
export function defineSpell(input: SpellDefinition): SpellDefinition {
  if (
    input.cost.powerChoice &&
    (!input.cost.powerChoice.length ||
      input.cost.powerChoice.some((c) => !c.trim()))
  )
    throw new RangeError(`${input.id}: couleurs de Power invalides.`);
  for (const value of [input.cost.energy, ...Object.values(input.cost.power)]) {
    if (!Number.isFinite(value) || value < 0)
      throw new RangeError(`${input.id}: coût invalide.`);
  }
  if (!input.effects.length) throw new RangeError(`${input.id}: aucun effet.`);
  for (const effect of input.effects) {
    if (
      (effect.type === 'damage' ||
        effect.type === 'damage-enemies-at-battlefield') &&
      (!Number.isFinite(effect.amount) || effect.amount < 0)
    )
      throw new RangeError(`${input.id}: dégâts invalides.`);
    if (
      (effect.type === 'modify-might' || effect.type === 'boost-allies') &&
      !Number.isFinite(effect.amount)
    )
      throw new RangeError(`${input.id}: modificateur invalide.`);
    if (
      effect.type === 'draw' &&
      (!Number.isInteger(effect.count) || effect.count <= 0)
    )
      throw new RangeError(`${input.id}: quantité de pioche invalide.`);
  }
  return Object.freeze({
    ...printedMetadata(input.id),
    ...input,
    ...(input.tags ? { tags: Object.freeze([...input.tags]) } : {}),
    cost: Object.freeze({
      ...(input.cost.powerChoice
        ? { powerChoice: Object.freeze([...input.cost.powerChoice]) }
        : {}),
      ...(input.cost.powerChoiceAmount !== undefined
        ? { powerChoiceAmount: input.cost.powerChoiceAmount }
        : {}),
      energy: input.cost.energy,
      power: Object.freeze({ ...input.cost.power }),
    }),
    target: Object.freeze({ ...input.target }),
    effects: Object.freeze(
      input.effects.map((effect) => Object.freeze({ ...effect })),
    ),
  });
}
