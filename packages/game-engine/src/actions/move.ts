import type { GameState, GameAction, ActionResult } from '../types.js';

type MoveAction = Extract<GameAction, { type: 'move' }>;
type Unit = GameState['units'][number];
type MoveValidation =
  { ok: true; unit: Unit } | Extract<ActionResult, { ok: false }>;

/**
 * Entrée : état cohérent et intention de mouvement d'un joueur connu.
 * Sortie : refus ou unité déplacée/Tap. Un champ adverse ouvre un combat, un champ
 * neutre un Open Showdown ; renforcer son propre champ n'en ouvre pas.
 * Base ↔ champ, ou champ vers champ avec Ganking ; l'entrée est préservée.
 * Quitter seul un champ libère son contrôle sans effacer le registre des points du tour.
 */
export function moveUnit(state: GameState, action: MoveAction): ActionResult {
  const validation = validateMove(state, action);
  if (!validation.ok) return validation;
  return applyMove(state, action, validation.unit);
}

/** État + mouvement -> premier refus rencontré, ou unité autorisée à se déplacer. */
function validateMove(state: GameState, action: MoveAction): MoveValidation {
  if (
    state.showdown ||
    state.phase !== 'main' ||
    action.playerId !== state.activePlayerId
  ) {
    return { ok: false, reason: 'MOVEMENT_WINDOW_CLOSED' };
  }
  const unit = state.units.find((candidate) => candidate.id === action.unitId);
  const battlefield = state.battlefields.find(
    (candidate) => candidate.zoneId === action.destinationId,
  );
  const origin = state.zones.find((zone) => zone.id === unit?.zoneId);
  if (!unit || unit.ownerId !== action.playerId)
    return { ok: false, reason: 'INVALID_UNIT' };
  if (!unit.ready) return { ok: false, reason: 'UNIT_NOT_READY' };
  const ganking =
    state.unitDefinitions?.find((d) => d.id === unit.definitionId)?.ganking ===
    true;
  const destination = state.zones.find((z) => z.id === action.destinationId);
  const toField = !!battlefield && destination?.kind === 'battlefield';
  const toOwnBase =
    destination?.kind === 'base' && destination.ownerId === action.playerId;
  const fromOwnBase =
    origin?.kind === 'base' && origin.ownerId === action.playerId;
  const fromField = origin?.kind === 'battlefield';
  if (
    unit.zoneId === action.destinationId ||
    !(
      (fromOwnBase && toField) ||
      (fromField && (toOwnBase || (ganking && toField)))
    )
  ) {
    return { ok: false, reason: 'UNSUPPORTED_DESTINATION' };
  }
  if (state.players.length !== 2)
    return { ok: false, reason: 'UNSUPPORTED_MODE' };
  return { ok: true, unit };
}

/** Mouvement validé + unité trouvée -> nouvel état et événements, sans modifier l'entrée. */
function applyMove(
  state: GameState,
  action: MoveAction,
  unit: Unit,
): Extract<ActionResult, { ok: true }> {
  const participants = [
    action.playerId,
    ...state.players
      .filter((player) => player.id !== action.playerId)
      .map((player) => player.id),
  ];
  const defender = state.units.find(
    (candidate) =>
      candidate.zoneId === action.destinationId &&
      candidate.ownerId !== action.playerId,
  )?.ownerId;
  const battlefield = state.battlefields.find(
    (field) => field.zoneId === action.destinationId,
  );
  const opensShowdown =
    !!battlefield &&
    (!!defender || battlefield.controllerId !== action.playerId);
  const common = {
    battlefieldId: action.destinationId,
    initiatorId: action.playerId,
    participants,
    priorityPlayerId: action.playerId,
    consecutivePasses: 0,
  };
  return {
    ok: true,
    state: {
      ...state,
      battlefields: state.battlefields.map((field) =>
        field.zoneId === unit.zoneId &&
        !state.units.some(
          (other) => other.id !== unit.id && other.zoneId === unit.zoneId,
        )
          ? { ...field, controllerId: null }
          : field,
      ),
      units: state.units.map((candidate) =>
        candidate.id === unit.id
          ? { ...candidate, ready: false, zoneId: action.destinationId }
          : candidate,
      ),
      showdown: !opensShowdown
        ? null
        : defender
          ? {
              ...common,
              kind: 'combat',
              defenderId: defender,
              stage: 'priority',
              assignments: {},
            }
          : { ...common, kind: 'open' },
    },
    events: [
      {
        type: 'unit-moved',
        unitId: unit.id,
        from: unit.zoneId,
        to: action.destinationId,
      },
      ...(opensShowdown
        ? [
            {
              type: 'showdown-opened' as const,
              battlefieldId: action.destinationId,
            },
          ]
        : []),
    ],
  };
}
