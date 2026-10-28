/** Coût imprimé : énergie incolore + quantités de Power indexées par couleur.
 * Une couleur absente coûte zéro. Le paiement et les réserves appartiennent au moteur. */
export interface CardCost {
  /** Power supplémentaire payable dans ces couleurs, un symbole par défaut. */
  readonly powerChoice?: readonly string[];
  /** Nombre de symboles flexibles à payer, 1 par défaut ; entier positif. */
  readonly powerChoiceAmount?: number;
  readonly energy: number;
  readonly power: Readonly<Record<string, number>>;
}

/** Données communes à tous les exemplaires d'une carte unité.
 * `id` correspond au `definitionId` de ses instances. Might 0 est une valeur valide.
 * Propriétaire, zone, Ready/Tap et dégâts appartiennent à chaque instance en partie. */
export interface UnitDefinition {
  /** Bonus continu par instance de dégâts des sorts et capacités du propriétaire. */
  readonly spellAbilityDamageBonus?: number;
  /** Capacité ADD : épuiser cette unité Ready pour produire cette énergie réservée aux sorts. */
  readonly spellEnergyAbility?: number;
  /** Capacité déclenchée à la mise en jeu : dégâts à toutes les unités sur les champs. */
  readonly onPlayBattlefieldDamage?: number;
  /** À la mise en jeu, récupérer le sort choisi de son cimetière via la pile. */
  readonly onPlayReturnSpell?: boolean;
  /** Au lancement d'un sort de coût imprimé suffisant : bonus personnel pour le tour, via la pile. */
  readonly onExpensiveSpell?: {
    readonly minimumEnergy: number;
    readonly mightBonus: number;
  };
  /** Aura locale : bonus aux autres unités alliées dans la zone de cette unité. */
  readonly otherAlliesHereMightBonus?: number;
  /** Bonus statique selon le nombre de runes en jeu du propriétaire, Ready ou Tap. */
  readonly runeMightBonus?: {
    readonly minimum: number;
    readonly amount: number;
  };
  /** Autorise le mouvement basique entre deux champs distincts, avec Ready puis Tap. */
  readonly ganking?: boolean;
  /** Bonus de Might uniquement en attaque sur le champ du Combat Showdown. */
  readonly assault?: number;
  /** Bonus de Might uniquement en défense sur le champ du Combat Showdown. */
  readonly shield?: number;
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
  if (
    input.cost.powerChoiceAmount !== undefined &&
    (!input.cost.powerChoice?.length ||
      !Number.isInteger(input.cost.powerChoiceAmount) ||
      input.cost.powerChoiceAmount < 1)
  )
    throw new RangeError('Nombre de symboles flexibles invalide.');
  if (
    input.runeMightBonus &&
    (!Number.isInteger(input.runeMightBonus.minimum) ||
      input.runeMightBonus.minimum < 0 ||
      !Number.isFinite(input.runeMightBonus.amount) ||
      input.runeMightBonus.amount < 0)
  )
    throw new RangeError(`${input.id}: bonus conditionnel de runes invalide.`);
  for (const [field, value] of Object.entries({
    energy: input.cost.energy,
    might: input.might,
    shield: input.shield ?? 0,
    assault: input.assault ?? 0,
    otherAlliesHereMightBonus: input.otherAlliesHereMightBonus ?? 0,
    spellAbilityDamageBonus: input.spellAbilityDamageBonus ?? 0,
    spellEnergyAbility: input.spellEnergyAbility ?? 0,
    onPlayBattlefieldDamage: input.onPlayBattlefieldDamage ?? 0,
    minimumSpellEnergy: input.onExpensiveSpell?.minimumEnergy ?? 0,
    spellMightBonus: input.onExpensiveSpell?.mightBonus ?? 0,
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
    ...(input.onExpensiveSpell
      ? { onExpensiveSpell: Object.freeze({ ...input.onExpensiveSpell }) }
      : {}),
    ...(input.runeMightBonus
      ? { runeMightBonus: Object.freeze({ ...input.runeMightBonus }) }
      : {}),
    ...(input.onDeath ? { onDeath: Object.freeze({ ...input.onDeath }) } : {}),
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
  });
}
