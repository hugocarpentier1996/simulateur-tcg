import type { GameEvent, GameResult, GameState } from '../types.js';

/** État serveur d'un BO3 : conserver cet ensemble après chaque opération, sans mutation.
 * Les victoires de manches sont distinctes des points de la partie courante.
 * Réserves et champs utilisés contiennent des definitionId, par joueur. */
export interface Bo3State {
  game: GameState;
  gameNumber: 1 | 2 | 3;
  wins: Record<string, number>;
  battlefieldPools: Record<string, readonly string[]>;
  usedBattlefields: Record<string, string[]>;
  completedGames: { gameNumber: 1 | 2 | 3; result: GameResult }[];
  winnerId?: string;
}
export type Bo3Event =
  | GameEvent
  | {
      type: 'match-game-recorded';
      gameNumber: number;
      winnerId: string;
      wins: number;
    }
  | { type: 'match-ended'; winnerId: string };
/** Succès -> état complet et journal ; refus -> raison sans modification de l'entrée. */
export type Bo3Result =
  | { ok: true; state: Bo3State; events: Bo3Event[] }
  | { ok: false; reason: string };
