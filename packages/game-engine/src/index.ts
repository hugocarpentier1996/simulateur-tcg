// Interface publique du package : les traitements internes restent dans leurs modules.
export { act } from './act.js';
export { createBo3, startNextBo3Game } from './match/lifecycle.js';
export { actBo3, rollBo3 } from './match/actions.js';
export type { Bo3State, Bo3Result, Bo3Event } from './match/types.js';
export { createGame } from './setup/create-game.js';
export type { GameConfig, StartingCard } from './setup/create-game.js';
export { recordOpeningRoll } from './setup/roll.js';
export { effectiveMight, isStunned } from './effects/modifiers.js';
export type { SpellBlueprint, SpellEntry } from './spell-types.js';
export type {
  GameState,
  GameResult,
  GameAction,
  GameEvent,
  ActionResult,
  TurnPhase,
  ZoneKind,
  CardInstance,
  UnitState,
  UnitBlueprint,
  PaymentPlan,
  DamageAllocation,
} from './types.js';
