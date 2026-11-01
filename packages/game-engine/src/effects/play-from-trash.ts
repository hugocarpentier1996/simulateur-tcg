import type { GameEvent, GameState, UnitBlueprint } from '../types.js';
import { graveyardCard } from './graveyard-card.js';

/** Unité du cimetière du joueur -> jouée dans sa base, Tap (sauf entersReady), sans état
 * précédent ni effet de mise en jeu (hypothèse). Carte disparue : état inchangé. */
export function playUnitFromTrash(
  state: GameState,
  playerId: string,
  cardId: string | undefined,
): { state: GameState; events: GameEvent[] } {
  const card = cardId
    ? (graveyardCard(state, playerId, cardId, 'unit') ??
      state.cards.find(
        (c) =>
          c.id === cardId &&
          c.ownerId === playerId &&
          state.zones.some((z) => z.id === c.zoneId && z.kind === 'deck'),
      ))
    : undefined;
  const unit = state.unitDefinitions?.find((d) => d.id === card?.definitionId);
  const base = state.zones.find(
    (z) => z.kind === 'base' && z.ownerId === playerId,
  );
  if (!card || !unit || !base) return { state, events: [] };
  return {
    state: {
      ...state,
      cards: state.cards.filter((c) => c.id !== card.id),
      units: [
        ...state.units,
        {
          id: card.id,
          definitionId: card.definitionId,
          ownerId: playerId,
          zoneId: base.id,
          ready: unit.entersReady === true,
          might: unit.might,
          ...(unit.tank ? { tank: true } : {}),
          ...(unit.backline ? { backline: true } : {}),
          damage: 0,
        },
      ],
    },
    events: [
      {
        type: 'unit-played',
        playerId,
        unitId: card.id,
        definitionId: unit.id,
        zoneId: base.id,
      },
    ],
  };
}

/** Unités du cimetière jouables par une capacité onPlayFromTrash (plafonds de coût). */
export function trashUnitChoices(
  state: GameState,
  playerId: string,
  limits: NonNullable<UnitBlueprint['onPlayFromTrash']>,
): string[] {
  return state.cards
    .filter((c) => {
      if (!graveyardCard(state, playerId, c.id, 'unit')) return false;
      const cost = state.unitDefinitions?.find(
        (d) => d.id === c.definitionId,
      )?.cost;
      if (!cost) return false;
      const power =
        Object.values(cost.power).reduce((sum, n) => sum + (n ?? 0), 0) +
        (cost.genericPower ?? 0);
      return (
        (limits.maxEnergy === undefined || cost.energy <= limits.maxEnergy) &&
        (limits.maxPower === undefined || power <= limits.maxPower)
      );
    })
    .map((c) => c.id);
}

/** Coût de l'unité jouée + Power de l'unité qu'elle sort du cimetière (payPower). */
export function withTrashPower(
  state: GameState,
  definition: UnitBlueprint,
  trashCardId: string | undefined,
  cost: UnitBlueprint['cost'],
): UnitBlueprint['cost'] {
  if (!definition.onPlayFromTrash?.payPower || !trashCardId) return cost;
  const card = state.cards.find((c) => c.id === trashCardId);
  const unit = state.unitDefinitions?.find((d) => d.id === card?.definitionId);
  if (!unit) return cost;
  const power = { ...cost.power };
  for (const [color, n] of Object.entries(unit.cost.power))
    power[color] = (power[color] ?? 0) + (n ?? 0);
  return {
    ...cost,
    power,
    ...(unit.cost.genericPower
      ? { genericPower: (cost.genericPower ?? 0) + unit.cost.genericPower }
      : {}),
  };
}
