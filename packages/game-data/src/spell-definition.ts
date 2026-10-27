import type { CardCost } from './unit-definition.js';

/** Timing du lancement : les trois ouvrent une fenêtre de Réaction.
 * Normal : notre Main. Action : aussi notre priorité en open state de Showdown.
 * Réaction : mêmes fenêtres, plus réponse en closed state, y compris à une Réaction. */
export type SpellTiming = 'normal' | 'action' | 'reaction';

/** Effets déclaratifs, dans l'ordre de résolution. Les effets d'unité concernent la
 * cible choisie ; draw concerne le lanceur. Fin de tour = tour courant, pas prochain
 * tour du propriétaire. Un déplacement par effet conserve l'état Ready/Tap existant. */
export type SpellEffect =
  | { readonly type: 'duel' }
  | { readonly type: 'damage'; readonly amount: number }
  | { readonly type: 'recall-on-death'; readonly duration: 'end-of-turn' }
  | {
      readonly type: 'move-unit';
      readonly requiresReady: false;
      readonly exhaustsUnit: false;
    }
  | {
      readonly type: 'modify-might';
      readonly amount: number;
      readonly duration: 'end-of-turn';
    }
  | { readonly type: 'draw'; readonly count: number; readonly player: 'caster' }
  | { readonly type: 'stun'; readonly duration: 'end-of-turn' };

/** Données imprimées du sort, sans Might. Coût payé au lancement, effets à la résolution.
 * combatRole attacker désigne une unité du camp attaquant sur le champ du combat actif,
 * jamais un défenseur ni une autre unité du joueur attaquant restée dans sa base.
 * Le déplacement demandera également une destination légale au moteur. */
export interface SpellDefinition {
  readonly text?: string;
  readonly imageUrl?: string;
  readonly id: string;
  readonly name: string;
  readonly type: 'spell';
  readonly timing: SpellTiming;
  readonly cost: CardCost;
  readonly target: {
    readonly zone?: 'battlefield';
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
  for (const value of [input.cost.energy, ...Object.values(input.cost.power)]) {
    if (!Number.isFinite(value) || value < 0)
      throw new RangeError(`${input.id}: coût invalide.`);
  }
  if (!input.effects.length) throw new RangeError(`${input.id}: aucun effet.`);
  for (const effect of input.effects) {
    if (
      effect.type === 'damage' &&
      (!Number.isFinite(effect.amount) || effect.amount < 0)
    )
      throw new RangeError(`${input.id}: dégâts invalides.`);
    if (effect.type === 'modify-might' && !Number.isFinite(effect.amount))
      throw new RangeError(`${input.id}: modificateur invalide.`);
    if (
      effect.type === 'draw' &&
      (!Number.isInteger(effect.count) || effect.count <= 0)
    )
      throw new RangeError(`${input.id}: quantité de pioche invalide.`);
  }
  return Object.freeze({
    ...input,
    cost: Object.freeze({
      energy: input.cost.energy,
      power: Object.freeze({ ...input.cost.power }),
    }),
    target: Object.freeze({ ...input.target }),
    effects: Object.freeze(
      input.effects.map((effect) => Object.freeze({ ...effect })),
    ),
  });
}
