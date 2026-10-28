import type { GameState } from './types.js';
import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { stupefy, flash } from '../../game-data/src/index.js';
import { act } from './act.js';
import { getLegalActions } from './legal/actions.js';
import { travelingMerchant } from '../../game-data/src/index.js';
function setup(): GameState {
  const s = spellScenario(stupefy);
  return {
    ...s,
    unitDefinitions: [travelingMerchant],
    units: s.units.map((u) =>
      u.id === 'ally'
        ? {
            ...u,
            definitionId: travelingMerchant.id,
            zoneId: 'base-a',
            might: 2,
          }
        : u,
    ),
  };
}
const move = {
  type: 'move' as const,
  playerId: 'a',
  unitId: 'ally',
  destinationId: 'f',
};
it('une capacité déclenchée par Flash retarde la clôture du combat et le score', () => {
  let s = setup();
  s.spellDefinitions = [flash];
  s.cards = s.cards.map((c) =>
    c.id === 'spell' ? { ...c, definitionId: flash.id } : c,
  );
  s.units = [
    { ...s.units[0]!, zoneId: 'g' },
    { ...s.units[0]!, id: 'remaining', definitionId: 'test', zoneId: 'g' },
  ];
  s.showdown = {
    kind: 'combat',
    battlefieldId: 'g',
    initiatorId: 'a',
    defenderId: 'b',
    stage: 'priority',
    assignments: {},
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'a',
    selectedUnitIds: ['ally'],
    payment: noRunes,
  });
  // Instantané après dégâts : une réaction est encore en pile, le défenseur est éliminé.
  s = {
    ...s,
    combatAftermath: { defenderEliminated: true },
    showdown: {
      ...s.showdown!,
      kind: 'combat',
      defenderId: 'b',
      stage: 'effects',
      assignments: {},
    },
  };
  s = resolveTop(s);
  expect(s.stack?.entries).toHaveLength(1);
  expect(s.players[0]!.score).toBe(0);
  expect(s.showdown).not.toBeNull();
  s = resolveTop(s);
  expect(s.players[0]!.score).toBe(1);
  expect(s.showdown).toBeNull();
});
it('Merchant attend les réactions puis le choix de défausse avant de piocher', () => {
  let s = step(setup(), move);
  expect(s.stack?.entries).toHaveLength(1);
  s = resolveTop(s);
  expect(s.pendingDiscard?.playerId).toBe('a');
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('deck-a');
  expect(act(s, { type: 'pass', playerId: 'a' }).ok).toBe(false);
  expect(
    act(s, { type: 'choose-discard', playerId: 'b', cardId: 'spell' }).ok,
  ).toBe(false);
  expect(
    act(s, { type: 'choose-discard', playerId: 'a', cardId: 'draw-a-0' }).ok,
  ).toBe(false);
  expect(getLegalActions(s, 'a')).toEqual([
    { type: 'choose-discard', playerId: 'a', cardId: 'spell' },
  ]);
  s = step(s, { type: 'choose-discard', playerId: 'a', cardId: 'spell' });
  expect(s.cards.find((c) => c.id === 'spell')?.zoneId).toBe('graveyard-a');
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
  expect(s.stack).toBeNull();
});
it('Merchant main vide pioche quand même, sans choix de défausse', () => {
  let s = setup();
  s.cards = s.cards.filter((c) => c.zoneId !== 'hand-a');
  s = step(s, move);
  expect(s.stack?.entries).toHaveLength(1);
  s = resolveTop(s);
  expect(s.pendingDiscard).toBeFalsy();
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
});
it('Flash déclenche Merchant au-dessus du sort restant et reprend la fenêtre après la défausse', () => {
  let s = setup();
  s.units[0]!.zoneId = 'f';
  s.spellDefinitions = [stupefy, flash];
  s.cards.push(
    { id: 'flash', definitionId: flash.id, ownerId: 'a', zoneId: 'hand-a' },
    { id: 'spare', definitionId: 'test', ownerId: 'a', zoneId: 'hand-a' },
  );
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  });
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'flash',
    targetId: 'a',
    selectedUnitIds: ['ally'],
    payment: noRunes,
  });
  s = resolveTop(s);
  expect(s.stack?.entries).toHaveLength(2);
  expect(s.units[0]?.zoneId).toBe('base-a');
  // Main vidée par les deux sorts : la capacité pioche, puis Stupefy dispose de sa propre fenêtre.
  s = resolveTop(s);
  expect(s.pendingDiscard).toBeTruthy();
  s = step(s, { type: 'choose-discard', playerId: 'a', cardId: 'spare' });
  expect(s.stack?.entries).toHaveLength(1);
  expect(s.stack?.consecutivePasses).toBe(0);
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
  s = resolveTop(s);
  expect(s.cards.find((c) => c.id === 'draw-a-1')?.zoneId).toBe('hand-a');
});
