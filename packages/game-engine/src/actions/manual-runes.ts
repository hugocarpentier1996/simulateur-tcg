import type {
  ActionResult,
  CardInstance,
  GameAction,
  GameState,
} from '../types.js';
import { canUseTiming } from './timing.js';

type RuneAction = Extract<GameAction, { type: 'tap-rune' | 'recycle-rune' }>;

/** Rune en jeu du demandeur, ou refus. La fenêtre est celle d'une Réaction : Main du
 * joueur actif, priorité de Showdown ou de pile. Aucune pile n'est créée (capacité ADD). */
function ownRune(
  state: GameState,
  action: RuneAction,
): { ok: true; rune: CardInstance } | { ok: false; reason: string } {
  const rune = state.cards.find((c) => c.id === action.runeId);
  const inPlay = state.zones.some(
    (z) =>
      z.id === rune?.zoneId &&
      z.kind === 'runes' &&
      z.ownerId === action.playerId,
  );
  if (!rune || !rune.color || rune.ownerId !== action.playerId || !inPlay)
    return { ok: false, reason: 'INVALID_RUNE' };
  if (!canUseTiming(state, action.playerId, 'reaction'))
    return { ok: false, reason: 'ABILITY_WINDOW_CLOSED' };
  return { ok: true, rune };
}

/** Rune Ready -> Tap et +1 énergie dans la réserve flottante (vidée en fin de Draw et de tour).
 * Refuse rune Tap, adverse, hors jeu ou sans fenêtre ; aucun autre changement. */
export function tapRune(
  state: GameState,
  action: Extract<GameAction, { type: 'tap-rune' }>,
): ActionResult {
  const found = ownRune(state, action);
  if (!found.ok) return found;
  if (found.rune.ready !== true) return { ok: false, reason: 'RUNE_NOT_READY' };
  const previous = state.resources[action.playerId] ?? { energy: 0, power: {} };
  return {
    ok: true,
    state: {
      ...state,
      cards: state.cards.map((c) =>
        c.id === found.rune.id ? { ...c, ready: false } : c,
      ),
      resources: {
        ...state.resources,
        [action.playerId]: { ...previous, energy: previous.energy + 1 },
      },
    },
    events: [
      {
        type: 'rune-used',
        playerId: action.playerId,
        runeId: found.rune.id,
        energy: 1,
        power: null,
      },
    ],
  };
}

/** Rune en jeu -> sous son deck de runes, +1 Power de sa couleur ; si elle était Ready,
 * +1 énergie en plus (Tap puis recyclage). Même fenêtre et mêmes refus que tapRune. */
export function recycleRune(
  state: GameState,
  action: Extract<GameAction, { type: 'recycle-rune' }>,
): ActionResult {
  const found = ownRune(state, action);
  if (!found.ok) return found;
  const pile = state.zones.find(
    (z) => z.ownerId === action.playerId && z.kind === 'rune-pile',
  );
  if (!pile) return { ok: false, reason: 'MISSING_RUNE_PILE' };
  const { rune } = found;
  const color = rune.color!;
  const energy = rune.ready === true ? 1 : 0;
  const previous = state.resources[action.playerId] ?? { energy: 0, power: {} };
  return {
    ok: true,
    state: {
      ...state,
      cards: [
        ...state.cards.filter((c) => c.id !== rune.id),
        { ...rune, zoneId: pile.id, ready: false },
      ],
      resources: {
        ...state.resources,
        [action.playerId]: {
          ...previous,
          energy: previous.energy + energy,
          power: {
            ...previous.power,
            [color]: (previous.power[color] ?? 0) + 1,
          },
        },
      },
    },
    events: [
      {
        type: 'rune-used',
        playerId: action.playerId,
        runeId: rune.id,
        energy,
        power: color,
      },
    ],
  };
}
