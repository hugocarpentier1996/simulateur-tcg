/** Coût imprimé : énergie incolore + quantités de Power indexées par couleur.
 * Une couleur absente coûte zéro. Le paiement et les réserves appartiennent au moteur. */
export interface CardCost {
  readonly energy: number;
  readonly power: Readonly<Record<string, number>>;
}

/** Données communes à tous les exemplaires d'une carte unité.
 * `id` correspond au `definitionId` de ses instances. Might 0 est une valeur valide.
 * Propriétaire, zone, Ready/Tap et dégâts appartiennent à chaque instance en partie. */
export interface UnitDefinition {
  /** Exception imprimée : arrivée Ready au lieu de Tap ; false/absent garde Tap. */
  readonly entersReady?: boolean;
  /** Métadonnées d'affichage, jamais chargées par le moteur. */
  readonly imageUrl?: string;
  readonly text?: string;
  readonly onDeath?: {
    readonly type: 'summon-token';
    readonly definitionId: string;
  };
  readonly id: string;
  readonly name: string;
  readonly type: 'unit';
  readonly cost: CardCost;
  readonly might: number;
}

/** Entrée : définition d'unité. Sortie : copie figée, indépendante des données fournies.
 * Refuse par RangeError les coûts ou la Might négatifs, NaN ou infinis.
 * Aucun effet de carte ni traitement de paiement n'est exécuté ici. */
export function defineUnit(input: UnitDefinition): UnitDefinition {
  for (const [field, value] of Object.entries({
    energy: input.cost.energy,
    might: input.might,
    ...Object.fromEntries(
      Object.entries(input.cost.power).map(([color, amount]) => [
        `power.${color}`,
        amount,
      ]),
    ),
  })) {
    if (!Number.isFinite(value) || value < 0)
      throw new RangeError(
        `${input.id}: ${field} doit être un nombre fini positif ou nul.`,
      );
  }
  return Object.freeze({
    ...input,
    ...(input.onDeath ? { onDeath: Object.freeze({ ...input.onDeath }) } : {}),
    cost: Object.freeze({
      energy: input.cost.energy,
      power: Object.freeze({ ...input.cost.power }),
    }),
  });
}
