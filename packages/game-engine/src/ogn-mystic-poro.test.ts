import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { stupefy } from '../../game-data/src/index.js';
import { getLegalActions } from './legal/actions.js';
import { mysticPoro } from '../../game-data/src/index.js';
it.each([true, false])(
  'Vision regarde après réactions puis recycle au-dessous ou garde : %s',
  (recycle) => {
    let s = spellScenario(stupefy);
    s.unitDefinitions = [mysticPoro];
    s.cards.push({
      id: 'poro',
      definitionId: mysticPoro.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    });
    s = step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'poro',
      payment: noRunes,
    });
    expect(s.pendingVision).toBeUndefined();
    s = step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    });
    s = resolveTop(s);
    s = resolveTop(s);
    expect(s.pendingVision).toMatchObject({
      playerId: 'a',
      cardId: 'draw-a-1',
    });
    expect(getLegalActions(s, 'b')).toEqual([]);
    expect(getLegalActions(s, 'a')).toEqual([
      { type: 'choose-vision', playerId: 'a', recycle: false },
      { type: 'choose-vision', playerId: 'a', recycle: true },
    ]);
    s = step(s, { type: 'choose-vision', playerId: 'a', recycle });
    expect(
      s.cards.filter((c) => c.zoneId === 'deck-a').map((c) => c.id),
    ).toEqual(recycle ? ['draw-a-2', 'draw-a-1'] : ['draw-a-1', 'draw-a-2']);
    expect(s.stack).toBeNull();
  },
);
it('Vision avec deck vide ne pioche pas et ne donne aucun point', () => {
  let s = spellScenario(stupefy);
  s.unitDefinitions = [mysticPoro];
  s.cards = s.cards.filter((c) => c.zoneId !== 'deck-a');
  s.cards[0]!.definitionId = mysticPoro.id;
  s = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'spell',
    payment: noRunes,
  });
  expect(s.stack?.entries).toHaveLength(1);
  s = resolveTop(s);
  expect(s.pendingVision).toBeFalsy();
  expect(s.result).toBeUndefined();
  expect(s.players[1]!.score).toBe(0);
});
it('Vision placée hors Showdown : aucune nouvelle fenêtre, le joueur actif reprend sa Main', () => {
  let s = spellScenario(stupefy);
  s.unitDefinitions = [mysticPoro];
  s.cards[0]!.definitionId = mysticPoro.id;
  s = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'spell',
    payment: noRunes,
  });
  s = resolveTop(s);
  s = step(s, { type: 'choose-vision', playerId: 'a', recycle: true });
  expect(s.stack).toBeNull();
  expect(s.priorityPlayerId ?? null).toBeNull();
  expect(getLegalActions(s, 'b')).toEqual([]);
  const actions = getLegalActions(s, 'a').map((a) => a.type);
  expect(actions).toContain('end-turn');
});
