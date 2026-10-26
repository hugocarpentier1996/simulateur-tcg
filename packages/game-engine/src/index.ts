// Interface publique du package : les traitements internes restent dans leurs modules.
export { act } from './act.js';
export { effectiveMight, isStunned } from './effects/modifiers.js';
export type { SpellBlueprint, SpellEntry } from './spell-types.js';
export type {
  GameState,
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
