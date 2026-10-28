import type {
  ActionResult,
  CardInstance,
  GameState,
  ZoneKind,
} from '../types.js';
import { prepareBattlefields } from './battlefields.js';
import { validGameConfig } from './validate.js';

/** Instances déjà sélectionnées, avec identifiants uniques fournis par l'appelant. */
export type StartingCard = Pick<CardInstance, 'id' | 'definitionId' | 'color'>;

/** Configuration de confiance : listes du sommet au dessous, déjà mélangées par le serveur.
 * Légende/champion séparés du main deck. La légalité des decks et des tags reste externe.
 * Deux joueurs et deux champs au démarrage dans cette tranche 1v1. */
export interface GameConfig {
  players: readonly {
    id: string;
    deck: readonly StartingCard[];
    runes: readonly StartingCard[];
    legend: StartingCard & { colors: readonly string[] };
    champion: StartingCard;
    battlefields: readonly StartingCard[];
  }[];
  /** BO1 par défaut ; manches ultérieures : perdant fourni par l'organisateur serveur. */
  match?:
    | { format: 'bo1' }
    | { format: 'bo3'; gameNumber: 1 }
    | { format: 'bo3'; gameNumber: 2 | 3; previousLoserId: string };
  randomState?: number;
  legendDefinitions?: GameState['legendDefinitions'];
  unitDefinitions?: GameState['unitDefinitions'];
  spellDefinitions?: GameState['spellDefinitions'];
  gearDefinitions?: GameState['gearDefinitions'];
}

/** Configuration -> état neuf en attente des dés, aucune main distribuée avant le choix.
 * Refuse mode autre que 1v1, composition/identifiants/couleurs invalides et collisions de zones.
 * BO1 : choix des champs par hasard reproductible. BO3 : attend les choix avant les dés.
 * Ne valide pas un JSON non typé ni les tags du champion. */
export function createGame(config: GameConfig): ActionResult {
  if (config.players.length !== 2)
    return { ok: false, reason: 'UNSUPPORTED_MODE' };
  const playerIds = config.players.map((p) => p.id);
  if (!validGameConfig(config))
    return { ok: false, reason: 'INVALID_GAME_CONFIG' };
  const kinds: ZoneKind[] = [
    'base',
    'deck',
    'hand',
    'rune-pile',
    'runes',
    'legend',
    'champion',
    'graveyard',
    'banished',
  ];
  const zoneId = (ownerId: string, kind: ZoneKind) => `zone:${ownerId}:${kind}`;
  const zones: GameState['zones'] = config.players.flatMap((p) =>
    kinds.map((kind) => ({ id: zoneId(p.id, kind), kind, ownerId: p.id })),
  );
  if (
    config.players.some((p) =>
      p.battlefields.some((b) => zones.some((z) => z.id === b.id)),
    )
  )
    return { ok: false, reason: 'INVALID_GAME_CONFIG' };
  const instances = config.players.flatMap((p) => {
    const place = (card: StartingCard, kind: ZoneKind): CardInstance => ({
      ...card,
      ownerId: p.id,
      zoneId: zoneId(p.id, kind),
      ...(['legend', 'champion'].includes(kind) ? { ready: true } : {}),
    });
    return [
      ...p.deck.map((c) => place(c, 'deck')),
      ...p.runes.map((c) => place(c, 'rune-pile')),
      place(p.legend, 'legend'),
      place(p.champion, 'champion'),
    ];
  });
  const state: GameState = {
    activePlayerId: playerIds[0]!,
    phase: 'setup',
    setup: { stage: 'roll' },
    players: playerIds.map((id) => ({ id, score: 0 })),
    zones,
    cards: instances,
    units: [],
    resources: Object.fromEntries(
      playerIds.map((id) => [id, { energy: 0, power: {} }]),
    ),
    battlefields: [],
    scoredBattlefields: Object.fromEntries(playerIds.map((id) => [id, []])),
    showdown: null,
    ...(config.randomState !== undefined
      ? { randomState: config.randomState }
      : {}),
    ...(config.legendDefinitions
      ? { legendDefinitions: config.legendDefinitions }
      : {}),
    ...(config.unitDefinitions
      ? { unitDefinitions: config.unitDefinitions }
      : {}),
    ...(config.spellDefinitions
      ? { spellDefinitions: config.spellDefinitions }
      : {}),
    ...(config.gearDefinitions
      ? { gearDefinitions: config.gearDefinitions }
      : {}),
  };
  return prepareBattlefields(state, config);
}
