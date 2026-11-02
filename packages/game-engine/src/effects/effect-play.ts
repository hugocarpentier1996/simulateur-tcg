import type { GameState, UnitBlueprint } from '../types.js';
import type { PlayEffectEntry } from './play-effect.js';
import type { ModeChoiceEntry } from './mode-choice.js';
import type { UnitPlayEntry } from './unit-play.js';
import { activeLegends } from './legends.js';
import { effectiveMight } from './modifiers.js';
import { playTargetChoices } from './play-targets.js';
import { buffOthersChoices } from '../actions/play-unit.js';
import { trashUnitChoices } from './play-from-trash.js';
import { recoverableSpells } from './return-spell.js';

/** Unité jouée par un effet (réponse 13) : elle est bien « jouée », ses capacités « when you
 * play me » sont empilées comme pour une mise en jeu depuis la main. Les effets ciblés
 * ouvrent un choix de cible à la résolution (modes `play-target:<id>`), les choix de cartes
 * et sélections d'alliées un choix `play-card:<i>`. */
export function effectPlayEntries(
  state: GameState,
  unitId: string,
  playerId: string,
): (PlayEffectEntry | ModeChoiceEntry | UnitPlayEntry)[] {
  const unit = state.units.find((u) => u.id === unitId);
  const definition = state.unitDefinitions?.find(
    (d) => d.id === unit?.definitionId,
  );
  if (!unit || !definition) return [];
  const legion = (state.cardsPlayedThisTurn?.[playerId] ?? 0) > 0;
  const entries: (PlayEffectEntry | ModeChoiceEntry | UnitPlayEntry)[] = [];
  const play = (effect: PlayEffectEntry['effect']) =>
    entries.push({
      kind: 'play-effect',
      sourceId: unit.id,
      ownerId: playerId,
      effect,
    });
  if (
    definition.onPlaySummonHere &&
    !(definition.onPlaySummonHereLegion && !legion)
  )
    for (let i = 0; i < (definition.onPlaySummonHereCount ?? 1); i++)
      play({
        type: 'summon-here',
        destinationId: unit.zoneId,
        definitionId: definition.onPlaySummonHere,
      });
  if (
    definition.onPlayVision ||
    state.units.some(
      (u) =>
        u.ownerId === playerId &&
        u.id !== unit.id &&
        state.unitDefinitions?.find((d) => d.id === u.definitionId)
          ?.alliesHaveVision,
    )
  )
    play({ type: 'vision' });
  if (
    definition.onPlayEffect &&
    !(
      (definition.onPlayEffect.type === 'discard' ||
        definition.onPlayEffect.type === 'buff-self') &&
      definition.onPlayEffect.legion &&
      !legion
    )
  )
    play(definition.onPlayEffect);
  if (
    definition.onPlayTargetEffect ||
    definition.onPlayReadyOther ||
    definition.onPlayMoveToBase
  )
    entries.push({
      kind: 'mode-choice',
      sourceId: unit.id,
      ownerId: playerId,
      modes: [],
      playTargetFor: unit.id,
    });
  // Choix de cartes ou sélection d'alliées, faits à la résolution (réponse 13).
  if (definition.onPlayBuffOthers || definition.onPlaySpendBuffsChannel)
    entries.push(cardChoice(unit.id, playerId, 'select'));
  if (definition.onPlayFromTrash)
    entries.push(cardChoice(unit.id, playerId, 'trash'));
  if (definition.onPlayReturnSpell || definition.onPlayReturnUnit)
    entries.push(cardChoice(unit.id, playerId, 'return'));
  if (definition.onPlayBattlefieldDamage !== undefined)
    entries.push({
      kind: 'unit-play',
      sourceId: unit.id,
      ownerId: playerId,
      amount: definition.onPlayBattlefieldDamage,
    });
  const storm =
    effectiveMight(unit, state) >= 5
      ? activeLegends(state, playerId).find(
          (l) => l.definition.mightyPlayChannel && l.card.ready !== false,
        )
      : undefined;
  if (storm)
    entries.push({
      kind: 'mode-choice',
      sourceId: storm.card.id,
      ownerId: playerId,
      modes: [],
      costlyMay: {
        sourceKind: 'card',
        sourceId: storm.card.id,
        effect: {
          type: 'channel-exhausted',
          count: storm.definition.mightyPlayChannel!,
        },
      },
    });
  return entries;
}

/** Cibles de la capacité ciblée d'une unité déjà en jeu (jouée par un effet) : aucun coût de
 * carte, seule la taxe Deflect compte. undefined = capacité sans cible. */
export function effectPlayTargets(
  state: GameState,
  unitId: string,
  playerId: string,
): { definition: UnitBlueprint; targets: (string | undefined)[] } | undefined {
  const unit = state.units.find((u) => u.id === unitId);
  const definition = state.unitDefinitions?.find(
    (d) => d.id === unit?.definitionId,
  );
  if (!unit || !definition) return undefined;
  const free = { ...definition, cost: { energy: 0, power: {} } };
  const view: GameState = {
    ...state,
    cards: [
      ...state.cards,
      {
        id: unit.id,
        definitionId: unit.definitionId,
        ownerId: playerId,
        zoneId: unit.zoneId,
      },
    ],
  };
  return {
    definition,
    targets: playTargetChoices(view, unit.id, free, unit.zoneId),
  };
}

function cardChoice(
  unitId: string,
  playerId: string,
  kind: 'select' | 'trash' | 'return',
): ModeChoiceEntry {
  return {
    kind: 'mode-choice',
    sourceId: unitId,
    ownerId: playerId,
    modes: [],
    playCardChoice: { unitId, kind },
  };
}

/** Options du choix de cartes d'une unité jouée par un effet : sélections d'alliées, unité
 * du cimetière à jouer, carte du cimetière à reprendre. */
export function playCardOptions(
  state: GameState,
  unitId: string,
  playerId: string,
  kind: 'select' | 'trash' | 'return',
): string[][] {
  const unit = state.units.find((u) => u.id === unitId);
  const definition = state.unitDefinitions?.find(
    (d) => d.id === unit?.definitionId,
  );
  if (!unit || !definition) return [];
  if (kind === 'select')
    return buffOthersChoices(state, playerId, unitId, definition).filter(
      (ids) => ids.length > 0,
    );
  if (kind === 'trash')
    return definition.onPlayFromTrash
      ? trashUnitChoices(state, playerId, definition.onPlayFromTrash).map(
          (id) => [id],
        )
      : [];
  return recoverableSpells(
    state,
    playerId,
    definition.onPlayReturnUnit ? 'unit' : 'spell',
  ).map((id) => [id]);
}
