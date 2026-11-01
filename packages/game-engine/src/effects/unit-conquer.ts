import type { GameState } from '../types.js';
import type { LegendEntry } from '../legend-types.js';
import type { ModeChoiceEntry } from './mode-choice.js';
import type { PlayEffectEntry } from './play-effect.js';

/** Conquérant + champ -> capacités « When I conquer » de ses unités présentes : pioche
 * (onConquerDraw) puis choix de mode (onConquerChoice), dans l'ordre des unités. Aussi
 * utilisé par Reckoner's Arena à la tenue. */
export function unitConquerEntries(
  state: GameState,
  playerId: string,
  battlefieldId: string,
): (LegendEntry | ModeChoiceEntry | PlayEffectEntry)[] {
  return state.units.flatMap((u) => {
    if (u.ownerId !== playerId || u.zoneId !== battlefieldId) return [];
    const definition = state.unitDefinitions?.find(
      (d) => d.id === u.definitionId,
    );
    const entries: (LegendEntry | ModeChoiceEntry | PlayEffectEntry)[] = [];
    if (definition?.onConquerDraw)
      entries.push({
        kind: 'legend-draw',
        sourceId: u.id,
        ownerId: playerId,
        count: definition.onConquerDraw,
      });
    const threshold = definition?.conquerExcessScore;
    if (
      threshold !== undefined &&
      state.combatExcess?.battlefieldId === battlefieldId &&
      state.combatExcess.playerId === playerId &&
      state.combatExcess.amount >= threshold
    )
      entries.push({
        kind: 'play-effect',
        sourceId: u.id,
        ownerId: playerId,
        effect: { type: 'score-points', amount: 1 },
      });
    if (definition?.onConquerReplaySpell)
      entries.push({
        kind: 'mode-choice',
        sourceId: u.id,
        ownerId: playerId,
        modes: [],
        replaySpell: true,
      });
    if (definition?.onConquerBuffSelf)
      entries.push({
        kind: 'play-effect',
        sourceId: u.id,
        ownerId: playerId,
        effect: { type: 'buff-units', unitIds: [u.id] },
      });
    if (definition?.onConquerPayReturn)
      entries.push({
        kind: 'mode-choice',
        sourceId: u.id,
        ownerId: playerId,
        modes: [],
        payReturn: true,
      });
    if (definition?.onConquerKillGearBuff)
      entries.push({
        kind: 'mode-choice',
        sourceId: u.id,
        ownerId: playerId,
        modes: [],
        killGearBuff: true,
      });
    if (definition?.onConquerChoice?.length)
      entries.push({
        kind: 'mode-choice',
        sourceId: u.id,
        ownerId: playerId,
        modes: definition.onConquerChoice,
      });
    return entries;
  });
}

/** Conquérant -> cartes de son cimetière à reprendre contre une défausse (Super Mega Death
 * Rocket!), chacune comme choix facultatif sur la pile. */
export function trashConquerEntries(
  state: GameState,
  playerId: string,
): ModeChoiceEntry[] {
  return state.cards
    .filter(
      (c) =>
        c.ownerId === playerId &&
        state.zones.some(
          (z) =>
            z.id === c.zoneId &&
            z.kind === 'graveyard' &&
            z.ownerId === playerId,
        ) &&
        state.spellDefinitions?.find((d) => d.id === c.definitionId)
          ?.returnOnConquerDiscard,
    )
    .map((c) => ({
      kind: 'mode-choice' as const,
      sourceId: c.id,
      ownerId: playerId,
      modes: [],
      discardReturn: true,
    }));
}
