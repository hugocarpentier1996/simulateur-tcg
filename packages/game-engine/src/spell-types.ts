import type { CardInstance, UnitBlueprint } from './types.js';

/** Catalogue de confiance : effets ordonnés compatibles avec game-data, sans dépendance d'exécution. */
export interface SpellBlueprint {
  readonly id: string;
  readonly type: 'spell';
  readonly optionalExhaustAlly?: boolean;
  /** Au cimetière, quand son propriétaire conquiert : défausser 1 pour la reprendre en main. */
  readonly returnOnConquerDiscard?: boolean;
  /** Hidden : peut être caché pour 1 Power puis joué gratuitement plus tard (Réaction). */
  readonly hidden?: boolean;
  /** Coût supplémentaire facultatif : dépenser le buff d'une unité alliée pour ignorer le coût. */
  readonly spendBuffForFreeCast?: boolean;
  /** Coût X : le lanceur choisit xPower, payé en Power quelconque en plus du coût. */
  readonly variablePower?: boolean;
  /** Réduction d'énergie propre au sort (plancher 0), avant les réductions d'unités. */
  readonly costReduction?:
    | {
        readonly kind: 'opponent-near-victory';
        readonly within: number;
        readonly energy: number;
      }
    /** Sky Splitter : réduite de la plus haute Might parmi les unités du lanceur. */
    | { readonly kind: 'highest-own-might' }
    /** Spoils of War : si une unité ennemie du lanceur est morte ce tour. */
    | { readonly kind: 'enemy-died-this-turn'; readonly energy: number };
  readonly timing: 'normal' | 'action' | 'reaction';
  readonly cost: UnitBlueprint['cost'];
  readonly target:
    | { readonly kind: 'graveyard-unit' }
    | { readonly kind: 'caster' }
    /** Un équipement en jeu, ou le lanceur lui-même pour renoncer (« you may »). */
    | { readonly kind: 'optional-gear' }
    /** Un sort sur la pile ; maxEnergy / maxPower plafonnent son coût imprimé. */
    | {
        readonly kind: 'stack-spell';
        readonly maxEnergy?: number;
        readonly maxPower?: number;
      }
    | { readonly kind: 'battlefield' }
    | {
        /** battlefield : sur un champ ; base : dans la base de son propriétaire. */
        readonly zone?: 'battlefield' | 'base';
        readonly maximumMight?: number;
        readonly allegiance?: 'friendly' | 'enemy';
        readonly kind: 'unit';
        readonly combatRole: 'any' | 'attacker';
      };
  readonly effects: readonly (
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
    | {
        readonly type: 'damage-enemies-at-battlefield';
        readonly amount: number;
      }
    | { readonly type: 'damage-enemies-in-combat'; readonly amount: number }
    /** Dégâts de sort à toutes les unités sur tous les champs (alliées comprises). */
    | { readonly type: 'damage-all-at-battlefields'; readonly amount: number }
    /** Épuise toutes les unités alliées du lanceur. */
    | { readonly type: 'exhaust-allies' }
    /** Détruit tous les équipements en jeu (cimetière de leur propriétaire). */
    | { readonly type: 'kill-all-gear' }
    /** En commençant par le joueur suivant, chacun peut renvoyer une unité en main (Whirlwind). */
    | { readonly type: 'each-player-may-return-unit' }
    /** Chaque joueur, en commençant par le lanceur, tue une de ses unités ou un de ses gears. */
    | { readonly type: 'each-player-kills'; readonly what: 'unit' | 'gear' }
    /** L'adversaire choisit Cartes (lanceur et lui piochent 1) ou Runes (chacun canalise 1
     * rune Tap), via un choix de mode (Party Favors, 1v1). */
    | { readonly type: 'party-favors' }
    /** Alliées Tap buffées : buff dépensé, redressées ; puis buff de toutes les alliées. */
    | { readonly type: 'spend-buffs-ready-then-buff-all' }
    /** Ce tour, les buffs des unités du lanceur donnent `amount` Might de plus (Stand United). */
    | { readonly type: 'empower-buffs'; readonly amount: number }
    /** Tue les unités selectedUnitIds (au moins une), toutes sur un même champ, de Might totale
     * au plus `maximum` (Fox-Fire ; revérifié à la résolution). */
    | { readonly type: 'kill-selected-total-might'; readonly maximum: number }
    /** Étourdit la cible alliée et l'unité ennemie secondaryTargetId du même champ (Facebreaker). */
    | { readonly type: 'stun-with-enemy-here' }
    /** Shield temporaire (+shield en défense) et Tank jusqu'à la fin du tour (Block). */
    | { readonly type: 'grant-shield-tank'; readonly shield: number }
    /** Défausse discardCardId (choisie au lancement) puis inflige à la cible son coût en énergie. */
    | { readonly type: 'discard-for-damage' }
    /** Regarde les `count` cartes du dessus de son deck, en garde 1 en main, recycle le reste. */
    | { readonly type: 'look-pick'; readonly count: number }
    /** Buffe la cible. */
    | { readonly type: 'buff-unit' }
    /** Déplace la cible vers le champ destinationId (jamais vers une base). */
    | { readonly type: 'move-to-battlefield' }
    /** Après move-unit : la cible et l'autre unité ennemie secondaryTargetId, présente à la
     * destination, s'infligent leur Might (comme un duel). */
    | { readonly type: 'fight-at-destination' }
    /** La cible meurt la prochaine fois qu'elle subit des dégâts ce tour ; Legion (une autre
     * carte jouée par le lanceur ce tour) : elle meurt aussitôt. */
    | { readonly type: 'guillotine' }
    /** Jusqu'à la fin du tour, toute unité qui subit des dégâts est tuée. */
    | { readonly type: 'damage-kills-this-turn' }
    /** Empêche tous les dégâts de sort et de capacité jusqu'à la fin du tour. */
    | { readonly type: 'prevent-effect-damage' }
    /** Double la Might actuelle de la cible ce tour et lui donne Temporary. */
    | { readonly type: 'double-might-temporary' }
    /** Ce tour, la Might de la cible monte à celle de l'autre unité alliée secondaryTargetId. */
    | { readonly type: 'match-ally-might' }
    /** X (Power quelconque payé au lancement) dégâts aux unités ennemies du champ ciblé. */
    | { readonly type: 'damage-enemies-at-battlefield-x' }
    /** Chaque joueur défausse toute sa main, puis chacun pioche `count` (lanceur d'abord). */
    | { readonly type: 'discard-hands-then-draw'; readonly count: number }
    /** L'unité ciblée inflige sa Might (dégâts du sort) à toutes les unités ennemies du champ
     * destinationId, puis s'y déplace. */
    | { readonly type: 'might-damage-enemies-then-move' }
    /** Facultatif : déplace l'unité alliée secondaryTargetId sur le champ de l'unité ciblée. */
    | { readonly type: 'move-ally-to-target' }
    /** Contre le sort ciblé (cible stack-spell) : retiré de la pile, au cimetière, sans effet. */
    | { readonly type: 'counter-spell' }
    /** `count` instructions « inflige amount à une unité » : selectedUnitIds en donne exactement
     * `count`, une même unité pouvant être choisie plusieurs fois (dégâts cumulés). */
    | {
        readonly type: 'damage-instances';
        readonly count: number;
        readonly amount: number;
      }
    /** Détruit l'équipement ciblé (cible optional-gear ; lanceur ciblé : aucun effet). */
    | { readonly type: 'kill-target-gear' }
    /** L'unité ciblée inflige sa Might à l'unité ennemie choisie au lancement
     * (secondaryTargetId), sans réciproque ; enemyZone restreint la zone de l'ennemie. */
    | { readonly type: 'strike'; readonly enemyZone?: 'battlefield' }
    /** Sur le champ ciblé : modificateurs jusqu'à la fin du tour aux alliés et aux ennemis
     * du lanceur ; `minimum` borne la baisse des ennemis. */
    | {
        readonly type: 'modify-battlefield-sides';
        readonly friendly: number;
        readonly enemy: number;
        readonly minimum?: number;
      }
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
    | {
        readonly type: 'kill-unit';
        /** Le contrôleur de l'unité tuée pioche ce nombre de cartes (Hidden Blade). */
        readonly controllerDraws?: number;
      }
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
        /** Seule destination : la base du propriétaire de l'unité. */
        readonly baseOnly?: boolean;
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
    | { readonly type: 'stun'; readonly duration: 'end-of-turn' }
    | {
        readonly type: 'draw';
        readonly countIfExhausted?: number;
        readonly count: number;
        readonly player: 'caster';
      }
  )[];
}

/** Sort payé en attente : cible et destination choisies au lancement, revérifiées à la résolution.
 * targetId désigne une unité, un champ, ou le lanceur pour un effet global sans cible individuelle. */
export interface SpellEntry {
  /** Coût supplémentaire déjà payé ; reste vrai si l’unité quitte ensuite le terrain. */
  exhaustedForCost?: boolean;
  /** Copie des destinations annoncées pour les Recrues. */
  tokenDestinations?: readonly string[];
  card: CardInstance;
  definition: SpellBlueprint;
  casterId: string;
  targetId: string;
  /** Flash : sélection de 0 à 2 unités alliées, copiée au lancement. */
  selectedUnitIds?: readonly string[];
  /** Carte de la main à défausser à la résolution (discard-for-damage). */
  discardCardId?: string;
  /** Adversaire du duel choisi au lancement ; requis pour l'effet duel. */
  secondaryTargetId?: string;
  destinationId?: string;
  /** Coût X payé au lancement (variablePower). */
  xPower?: number;
}
