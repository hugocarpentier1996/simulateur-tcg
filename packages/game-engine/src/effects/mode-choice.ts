import { dealSpellDamage } from './spell-damage.js';
import { settleLethalUnits } from './lethal-units.js';
import { findPayment } from '../legal/payment.js';
import { payCost } from '../cost/payment.js';
import { leaveBoard } from './leave-board.js';
import type {
  ActionResult,
  GameAction,
  GameState,
  UnitBlueprint,
} from '../types.js';
import { drawCardForPlayer } from '../turn/draw.js';
import { channelForPlayer } from '../turn/supplies.js';
import { continueStack } from '../actions/continue-stack.js';
import { killGears } from './kill-gear.js';
import { buffUnit } from './buff.js';

/** Mode proposé par une capacité « X ou Y » : pioche 1, canalise 1 rune Tap, ne rien faire,
 * ou détruire un gear précis puis buffer la source (`kill-gear:<id>`, Adaptatron). */
export type EffectMode =
  | 'draw'
  | 'channel-exhausted'
  | 'skip'
  | `kill-gear:${string}`
  | `discard-return:${string}`
  | 'pay-return'
  | 'favor-cards'
  | 'favor-runes'
  | `kill-own:${string}`
  | `return-unit:${string}`
  | `discard-opp:${string}`
  | `recycle-opp:${string}`
  | `suffer:${string}`
  | 'let-draw'
  | `recycle-any:${string}`
  | 'return-champion'
  | `retreat:${string}`
  | `arrange:${string}`
  | `reinforce:${string}`;

const ONE_ENERGY = { energy: 1, power: {} };

export interface ModeChoiceEntry {
  kind: 'mode-choice';
  sourceId: string;
  ownerId: string;
  modes: readonly EffectMode[];
  /** « You may kill a gear » : modes calculés à la résolution selon les gears en jeu. */
  killGearBuff?: boolean;
  /** Retour depuis le cimetière contre une défausse : modes selon la main à la résolution. */
  discardReturn?: boolean;
  /** Payer 1 énergie pour renvoyer la source en main (proposé seulement si payable). */
  payReturn?: boolean;
  /** Joueur qui profite aussi du mode choisi (lanceur de Party Favors). */
  partnerId?: string;
  /** Joueurs suivants à choisir à leur tour ce qu'ils tuent (Cull the Weak). */
  nextChoosers?: readonly string[];
  /** Reinforce : cartes regardées et réduction d'énergie de l'unité jouée. */
  lookedIds?: readonly string[];
  energyReduction?: number;
  /** Nombre de cartes du dessus du deck à arranger (The Candlelit Sanctum). */
  arrangeTop?: number;
  /** Champ dont les unités alliées peuvent être renvoyées en base (Reaver's Row). */
  retreatFrom?: string;
  /** Recyclages restant à choisir dans les cimetières (Forge of the Future). */
  recycleLeft?: number;
  /** Shakedown : dégâts si l'unité est choisie, pioches du partenaire sinon. */
  sufferAmount?: number;
  partnerDraws?: number;
  /** Ce que chaque joueur tue (each-player-kills) ou renvoie en main (Whirlwind). */
  killWhat?: 'unit' | 'gear' | 'return';
}

/** Capacité dépilée après réactions -> choix du mode par son propriétaire, sans fenêtre.
 * Destruction de gear sans gear en jeu : aucun choix, la capacité est sans effet. */
export function resolveModeChoice(
  state: GameState,
  entry: ModeChoiceEntry,
): Extract<ActionResult, { ok: true }> {
  const inTrash = state.cards.some(
    (c) =>
      c.id === entry.sourceId &&
      state.zones.some((z) => z.id === c.zoneId && z.kind === 'graveyard'),
  );
  const handIds = state.cards
    .filter((c) =>
      state.zones.some(
        (z) =>
          z.id === c.zoneId && z.kind === 'hand' && z.ownerId === entry.ownerId,
      ),
    )
    .map((c) => c.id);
  const retreats = entry.retreatFrom
    ? state.units
        .filter(
          (u) => u.ownerId === entry.ownerId && u.zoneId === entry.retreatFrom,
        )
        .map((u) => `retreat:${u.id}` as const)
    : [];
  const top = entry.arrangeTop
    ? state.cards
        .filter((c) =>
          state.zones.some(
            (z) =>
              z.id === c.zoneId &&
              z.kind === 'deck' &&
              z.ownerId === entry.ownerId,
          ),
        )
        .slice(0, entry.arrangeTop)
        .map((c) => c.id)
    : [];
  const modes: readonly EffectMode[] = entry.arrangeTop
    ? arrangements(top).map((kept) => `arrange:${kept.join('+')}` as const)
    : entry.retreatFrom
      ? ['skip', ...retreats]
      : entry.killGearBuff
        ? [
            'skip',
            ...(state.gears ?? []).map((g) => `kill-gear:${g.id}` as const),
          ]
        : entry.discardReturn
          ? inTrash
            ? ['skip', ...handIds.map((id) => `discard-return:${id}` as const)]
            : []
          : entry.payReturn
            ? state.units.some((u) => u.id === entry.sourceId) &&
              findPayment(state, entry.ownerId, ONE_ENERGY)
              ? ['skip', 'pay-return']
              : []
            : entry.modes;
  if (
    modes.length <= 1 &&
    (entry.killGearBuff ||
      entry.discardReturn ||
      entry.payReturn ||
      entry.retreatFrom ||
      entry.arrangeTop)
  )
    return {
      ok: true,
      state,
      events: [{ type: 'legend-effect-resolved', sourceId: entry.sourceId }],
    };
  return {
    ok: true,
    state: { ...state, pendingModeChoice: { ...entry, modes } },
    events: [],
  };
}

/** Propriétaire + mode proposé -> effet appliqué puis reprise de la pile. Mauvais joueur ou
 * mode absent : refus sans mutation. */
export function chooseMode(
  state: GameState,
  action: Extract<GameAction, { type: 'choose-mode' }>,
): ActionResult {
  const pending = state.pendingModeChoice;
  if (!pending) return { ok: false, reason: 'NO_MODE_CHOICE' };
  if (pending.ownerId !== action.playerId)
    return { ok: false, reason: 'NO_PRIORITY' };
  if (!pending.modes.includes(action.mode))
    return { ok: false, reason: 'INVALID_MODE' };
  const cleared = { ...state, pendingModeChoice: null };
  const applied = applyMode(cleared, pending, action.mode);
  if (pending.recycleLeft && action.mode.startsWith('recycle-any:')) {
    const next = trashRecycleChoice(
      applied.state,
      pending.sourceId,
      pending.ownerId,
      pending.recycleLeft - 1,
    );
    if (next)
      return {
        ok: true,
        state: { ...applied.state, pendingModeChoice: next },
        events: applied.events,
      };
  }
  if (pending.killWhat) {
    const next = nextKillChoice(
      applied.state,
      pending.sourceId,
      pending.killWhat,
      pending.nextChoosers ?? [],
    );
    if (next)
      return {
        ok: true,
        state: { ...applied.state, pendingModeChoice: next },
        events: applied.events,
      };
  }
  return continueStack(applied.state, [
    ...applied.events,
    { type: 'legend-effect-resolved', sourceId: pending.sourceId },
  ]);
}

function applyMode(
  state: GameState,
  pending: ModeChoiceEntry,
  mode: EffectMode,
): { state: GameState; events: Extract<ActionResult, { ok: true }>['events'] } {
  if (mode === 'draw') return drawCardForPlayer(state, pending.ownerId);
  if (mode === 'channel-exhausted')
    return channelForPlayer(state, pending.ownerId, 1);
  if (mode === 'skip' && !pending.lookedIds) return { state, events: [] };
  if (mode.startsWith('discard-opp:') || mode.startsWith('recycle-opp:')) {
    const id = mode.slice(mode.indexOf(':') + 1);
    const card = state.cards.find((c) => c.id === id);
    if (!card) return { state, events: [] };
    const zone = (kind: 'graveyard' | 'deck') =>
      state.zones.find((z) => z.kind === kind && z.ownerId === card.ownerId)
        ?.id ?? card.zoneId;
    if (mode.startsWith('discard-opp:'))
      return {
        state: {
          ...state,
          cards: state.cards.map((c) =>
            c.id === id ? { ...c, zoneId: zone('graveyard') } : c,
          ),
        },
        events: [
          { type: 'card-discarded', playerId: card.ownerId, cardId: id },
        ],
      };
    return {
      state: {
        ...state,
        cards: [
          ...state.cards.filter((c) => c.id !== id),
          { ...card, zoneId: zone('deck') },
        ],
      },
      events: [],
    };
  }
  if (pending.lookedIds) {
    const chosen = mode.startsWith('reinforce:')
      ? mode.slice('reinforce:'.length)
      : undefined;
    let next = state;
    const events: Extract<ActionResult, { ok: true }>['events'] = [];
    if (chosen) {
      const card = next.cards.find((c) => c.id === chosen);
      const unit = next.unitDefinitions?.find(
        (d) => d.id === card?.definitionId,
      );
      const cost = unit && reducedCost(unit.cost, pending.energyReduction ?? 0);
      const plan = cost && findPayment(next, pending.ownerId, cost);
      const paid = plan && payCost(next, pending.ownerId, cost, plan);
      const base = next.zones.find(
        (z) => z.kind === 'base' && z.ownerId === pending.ownerId,
      );
      if (card && unit && base && paid && paid.ok) {
        next = {
          ...paid.state,
          cards: paid.state.cards.filter((c) => c.id !== card.id),
          units: [
            ...paid.state.units,
            {
              id: card.id,
              definitionId: card.definitionId,
              ownerId: pending.ownerId,
              zoneId: base.id,
              ready: unit.entersReady === true,
              might: unit.might,
              ...(unit.tank ? { tank: true } : {}),
              ...(unit.backline ? { backline: true } : {}),
              damage: 0,
            },
          ],
        };
        events.push({
          type: 'unit-played',
          playerId: pending.ownerId,
          unitId: card.id,
          definitionId: unit.id,
          zoneId: base.id,
        });
      }
    }
    const rest = pending.lookedIds.filter(
      (id) => id !== chosen && next.cards.some((c) => c.id === id),
    );
    next = {
      ...next,
      cards: [
        ...next.cards.filter((c) => !rest.includes(c.id)),
        ...rest.map((id) => next.cards.find((c) => c.id === id)!),
      ],
    };
    return { state: next, events };
  }
  if (mode.startsWith('arrange:')) {
    const kept = mode.slice('arrange:'.length).split('+').filter(Boolean);
    const deckIds = state.cards
      .filter((c) =>
        state.zones.some(
          (z) =>
            z.id === c.zoneId &&
            z.kind === 'deck' &&
            z.ownerId === pending.ownerId,
        ),
      )
      .map((c) => c.id);
    const looked = deckIds.slice(0, pending.arrangeTop ?? 0);
    const byId = (id: string) => state.cards.find((c) => c.id === id)!;
    const others = state.cards.filter((c) => !looked.includes(c.id));
    const firstDeck = others.findIndex((c) => deckIds.includes(c.id));
    const at = firstDeck < 0 ? others.length : firstDeck;
    return {
      state: {
        ...state,
        cards: [
          ...others.slice(0, at),
          ...kept.map(byId),
          ...others.slice(at),
          ...looked.filter((id) => !kept.includes(id)).map(byId),
        ],
      },
      events: [],
    };
  }
  if (mode.startsWith('retreat:')) {
    const unit = state.units.find(
      (u) => u.id === mode.slice('retreat:'.length),
    );
    const base = state.zones.find(
      (z) => z.kind === 'base' && z.ownerId === unit?.ownerId,
    );
    if (!unit || !base) return { state, events: [] };
    return {
      state: {
        ...state,
        units: state.units.map((u) =>
          u.id === unit.id ? { ...u, zoneId: base.id } : u,
        ),
      },
      events: [
        { type: 'unit-moved', unitId: unit.id, from: unit.zoneId, to: base.id },
      ],
    };
  }
  if (mode === 'return-champion') {
    const championId = championReturnable(state, pending.ownerId);
    const zone = state.zones.find(
      (z) => z.kind === 'champion' && z.ownerId === pending.ownerId,
    );
    if (!championId || !zone) return { state, events: [] };
    return {
      state: {
        ...state,
        cards: state.cards.map((c) =>
          c.id === championId ? { ...c, zoneId: zone.id } : c,
        ),
      },
      events: [],
    };
  }
  if (mode.startsWith('recycle-any:')) {
    const card = state.cards.find(
      (c) => c.id === mode.slice('recycle-any:'.length),
    );
    const deck = state.zones.find(
      (z) => z.kind === 'deck' && z.ownerId === card?.ownerId,
    );
    if (!card || !deck) return { state, events: [] };
    return {
      state: {
        ...state,
        cards: [
          ...state.cards.filter((c) => c.id !== card.id),
          { ...card, zoneId: deck.id },
        ],
      },
      events: [],
    };
  }
  if (mode.startsWith('suffer:')) {
    const unit = state.units.find((u) => u.id === mode.slice('suffer:'.length));
    if (!unit) return { state, events: [] };
    const damaged = dealSpellDamage(
      state,
      pending.sourceId,
      pending.partnerId ?? pending.ownerId,
      [unit],
      pending.sufferAmount ?? 0,
    );
    const settled = settleLethalUnits(damaged.state);
    return {
      state: settled.state,
      events: [...damaged.events, ...settled.events],
    };
  }
  if (mode === 'let-draw') {
    let next = state;
    const events: Extract<ActionResult, { ok: true }>['events'] = [];
    for (let i = 0; i < (pending.partnerDraws ?? 0) && !next.result; i++) {
      const drawn = drawCardForPlayer(
        next,
        pending.partnerId ?? pending.ownerId,
      );
      next = drawn.state;
      events.push(...drawn.events);
    }
    return { state: next, events };
  }
  if (mode.startsWith('return-unit:')) {
    const unit = state.units.find(
      (u) => u.id === mode.slice('return-unit:'.length),
    );
    return unit ? leaveBoard(state, unit, 'hand') : { state, events: [] };
  }
  if (mode.startsWith('kill-own:')) {
    const id = mode.slice('kill-own:'.length);
    return pending.killWhat === 'gear'
      ? killGears(state, [id])
      : settleLethalUnits(state, new Set([id]));
  }
  if (mode === 'favor-cards' || mode === 'favor-runes') {
    let next = state;
    const events: Extract<ActionResult, { ok: true }>['events'] = [];
    for (const playerId of [pending.partnerId, pending.ownerId]) {
      if (!playerId || next.result) continue;
      const r =
        mode === 'favor-cards'
          ? drawCardForPlayer(next, playerId)
          : channelForPlayer(next, playerId, 1);
      next = r.state;
      events.push(...r.events);
    }
    return { state: next, events };
  }
  if (mode === 'pay-return') {
    const unit = state.units.find((u) => u.id === pending.sourceId);
    const payment = findPayment(state, pending.ownerId, ONE_ENERGY);
    const paid =
      payment && payCost(state, pending.ownerId, ONE_ENERGY, payment);
    if (!unit || !paid || !paid.ok) return { state, events: [] };
    const left = leaveBoard(paid.state, unit, 'hand');
    return { state: left.state, events: left.events };
  }
  if (mode.startsWith('discard-return:')) {
    const discardId = mode.slice('discard-return:'.length);
    const zone = (kind: 'hand' | 'graveyard') =>
      state.zones.find((z) => z.kind === kind && z.ownerId === pending.ownerId)
        ?.id;
    return {
      state: {
        ...state,
        cards: state.cards.map((c) =>
          c.id === discardId
            ? { ...c, zoneId: zone('graveyard') ?? c.zoneId }
            : c.id === pending.sourceId
              ? { ...c, zoneId: zone('hand') ?? c.zoneId }
              : c,
        ),
      },
      events: [
        {
          type: 'card-discarded',
          playerId: pending.ownerId,
          cardId: discardId,
        },
      ],
    };
  }
  const killed = killGears(state, [mode.slice('kill-gear:'.length)]);
  return {
    state: killed.events.length
      ? buffUnit(killed.state, pending.sourceId)
      : killed.state,
    events: killed.events,
  };
}

/** Premier joueur de la liste ayant quelque chose à tuer -> son choix (« kill-own:<id> »),
 * les suivants restant en file. Personne : undefined. */
export function nextKillChoice(
  state: GameState,
  sourceId: string,
  what: 'unit' | 'gear' | 'return',
  players: readonly string[],
): ModeChoiceEntry | undefined {
  for (const [i, playerId] of players.entries()) {
    if (what === 'return') {
      if (!state.units.length) return undefined;
      return {
        kind: 'mode-choice',
        sourceId,
        ownerId: playerId,
        modes: [
          'skip',
          ...state.units.map((u) => `return-unit:${u.id}` as const),
        ],
        killWhat: what,
        nextChoosers: players.slice(i + 1),
      };
    }
    const ids = (what === 'unit' ? state.units : (state.gears ?? []))
      .filter((p) => p.ownerId === playerId)
      .map((p) => p.id);
    if (ids.length)
      return {
        kind: 'mode-choice',
        sourceId,
        ownerId: playerId,
        modes: ids.map((id) => `kill-own:${id}` as const),
        killWhat: what,
        nextChoosers: players.slice(i + 1),
      };
  }
  return undefined;
}

/** Main de l'adversaire révélée -> choix du joueur parmi ses cartes (hors unités pour un
 * recyclage). Rien à choisir : undefined. */
export function opponentHandChoice(
  state: GameState,
  sourceId: string,
  playerId: string,
  action: 'discard' | 'recycle-non-unit',
): ModeChoiceEntry | undefined {
  const opponent = state.players.find((p) => p.id !== playerId);
  const ids = state.cards
    .filter(
      (c) =>
        state.zones.some(
          (z) =>
            z.id === c.zoneId &&
            z.kind === 'hand' &&
            z.ownerId === opponent?.id,
        ) &&
        (action === 'discard' ||
          !state.unitDefinitions?.some((d) => d.id === c.definitionId)),
    )
    .map((c) => c.id);
  if (!ids.length) return undefined;
  return {
    kind: 'mode-choice',
    sourceId,
    ownerId: playerId,
    modes: ids.map((id) =>
      action === 'discard'
        ? (`discard-opp:${id}` as const)
        : (`recycle-opp:${id}` as const),
    ),
  };
}

/** Recyclage au choix dans tous les cimetières : « skip » ou une carte ; rien à recycler ou
 * plus de recyclage : undefined. */
export function trashRecycleChoice(
  state: GameState,
  sourceId: string,
  playerId: string,
  left: number,
): ModeChoiceEntry | undefined {
  const ids = state.cards
    .filter((c) =>
      state.zones.some((z) => z.id === c.zoneId && z.kind === 'graveyard'),
    )
    .map((c) => c.id);
  if (left <= 0 || !ids.length) return undefined;
  return {
    kind: 'mode-choice',
    sourceId,
    ownerId: playerId,
    modes: ['skip', ...ids.map((id) => `recycle-any:${id}` as const)],
    recycleLeft: left,
  };
}

/** Chosen Champion du joueur au cimetière avec sa zone champion vide -> son id. */
export function championReturnable(
  state: GameState,
  playerId: string,
): string | undefined {
  const championId = state.chosenChampions?.[playerId];
  const zone = state.zones.find(
    (z) => z.kind === 'champion' && z.ownerId === playerId,
  );
  const inTrash = state.cards.some(
    (c) =>
      c.id === championId &&
      state.zones.some(
        (z) =>
          z.id === c.zoneId && z.kind === 'graveyard' && z.ownerId === playerId,
      ),
  );
  if (!zone || !inTrash || state.cards.some((c) => c.zoneId === zone.id))
    return undefined;
  return championId;
}

/** Cartes regardées -> sous-listes ordonnées conservées au-dessus (les autres recyclées),
 * des plus longues aux plus courtes. */
function arrangements(ids: readonly string[]): string[][] {
  const orders = (list: readonly string[]): string[][] =>
    list.length <= 1
      ? [[...list]]
      : list.flatMap((id, i) =>
          orders([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [
            id,
            ...rest,
          ]),
        );
  const subsets = (list: readonly string[], size: number): string[][] =>
    size === 0
      ? [[]]
      : list.flatMap((id, i) =>
          subsets(list.slice(i + 1), size - 1).map((rest) => [id, ...rest]),
        );
  const result: string[][] = [];
  for (let size = ids.length; size >= 0; size--)
    for (const subset of subsets(ids, size)) result.push(...orders(subset));
  return result;
}

/** Capacité de conquête The Candlelit Sanctum (choix à la résolution). */
export function sanctumEntry(
  battlefieldId: string,
  playerId: string,
  count = 2,
): ModeChoiceEntry {
  return {
    kind: 'mode-choice',
    sourceId: battlefieldId,
    ownerId: playerId,
    modes: [],
    arrangeTop: count,
  };
}

/** Coût d'unité moins une réduction d'énergie (plancher 0). */
function reducedCost(
  cost: UnitBlueprint['cost'],
  energy: number,
): UnitBlueprint['cost'] {
  return { ...cost, energy: Math.max(0, cost.energy - energy) };
}

/** Reinforce : cartes du dessus regardées -> choix d'une unité jouable (reste du coût
 * payable) ou « skip » ; le reste sera recyclé. */
export function lookPlayUnitChoice(
  state: GameState,
  sourceId: string,
  playerId: string,
  count: number,
  energyReduction: number,
): ModeChoiceEntry | undefined {
  const looked = state.cards
    .filter((c) =>
      state.zones.some(
        (z) => z.id === c.zoneId && z.kind === 'deck' && z.ownerId === playerId,
      ),
    )
    .slice(0, count);
  if (!looked.length) return undefined;
  const playable = looked.filter((c) => {
    const unit = state.unitDefinitions?.find((d) => d.id === c.definitionId);
    return (
      unit &&
      findPayment(state, playerId, reducedCost(unit.cost, energyReduction))
    );
  });
  return {
    kind: 'mode-choice',
    sourceId,
    ownerId: playerId,
    modes: ['skip', ...playable.map((c) => `reinforce:${c.id}` as const)],
    lookedIds: looked.map((c) => c.id),
    energyReduction,
  };
}
