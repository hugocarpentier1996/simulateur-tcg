import { expect, it } from 'vitest';
import {
  act,
  getLegalActions,
  type GameState,
  type GameAction,
} from './index.js';
import { flash, darkChild } from '../../game-data/src/index.js';
const legend = darkChild;
function fixture(): GameState {
  return {
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    activePlayerId: 'a',
    phase: 'main',
    showdown: null,
    units: [],
    battlefields: [],
    scoredBattlefields: {},
    resources: { a: { energy: 2, power: {} } },
    legendDefinitions: [legend],
    spellDefinitions: [flash],
    zones: ['a', 'b'].flatMap((ownerId) =>
      (
        [
          'legend',
          'runes',
          'rune-pile',
          'base',
          'hand',
          'deck',
          'graveyard',
        ] as const
      ).map((kind) => ({ id: `${kind}-${ownerId}`, kind, ownerId })),
    ),
    cards: [
      {
        id: 'legend',
        definitionId: legend.id,
        ownerId: 'a',
        zoneId: 'legend-a',
        ready: false,
      },
      ...[1, 2, 3].map((n) => ({
        id: `r${n}`,
        definitionId: 'rune',
        ownerId: 'a',
        zoneId: 'runes-a',
        color: 'rouge',
        ready: false,
      })),
      { id: 'flash', definitionId: flash.id, ownerId: 'a', zoneId: 'hand-a' },
      { id: 'draw', definitionId: 'test', ownerId: 'b', zoneId: 'deck-b' },
    ],
  };
}
const end: GameAction = {
  type: 'end-turn',
  playerId: 'a',
  readyRuneIds: ['r1', 'r3'],
};
function step(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}
function resolve(s: GameState) {
  s = step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId });
  return step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId });
}
it('choisit deux runes à la fin du tour et attend la pile entière avant le tour suivant', () => {
  const input = fixture();
  let s = step(input, end);
  expect(s.activePlayerId).toBe('a');
  expect(s.phase).toBe('end');
  expect(s.cards.find((c) => c.id === 'r1')!.ready).toBe(false);
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'flash',
    targetId: 'a',
    selectedUnitIds: [],
    payment: { energyRunes: [], powerRunes: [] },
  });
  s = resolve(s);
  expect(s.activePlayerId).toBe('a');
  s = resolve(s);
  expect(s.activePlayerId).toBe('b');
  expect(s.phase).toBe('main');
  expect(
    s.cards.filter((c) => c.zoneId === 'runes-a').map((c) => c.ready),
  ).toEqual([true, false, true]);
  expect(s.cards.find((c) => c.id === 'legend')!.ready).toBe(false);
  expect(s.resources.a!.energy).toBe(0);
  expect(input.cards.find((c) => c.id === 'r1')!.ready).toBe(false);
});
it('refuse omission, doublon, trop de runes ou cible étrangère ; propose les choix légaux', () => {
  const s = fixture();
  for (const readyRuneIds of [
    [],
    ['r1', 'r1'],
    ['r1', 'r2', 'r3'],
    ['r1', 'legend'],
  ])
    expect(act(s, { ...end, readyRuneIds }).ok).toBe(false);
  expect(act(s, { type: 'end-turn', playerId: 'a' }).ok).toBe(false);
  expect(getLegalActions(s, 'a')).toContainEqual(end);
});
it.each([0, 1])(
  'redresse seulement ce qui existe avec %s rune et ne bloque pas le tour',
  (count) => {
    const s = fixture();
    s.cards = s.cards.filter(
      (c) => !c.id.startsWith('r') || (c.id === 'r1' && count === 1),
    );
    expect(
      resolve(step(s, { ...end, readyRuneIds: count ? ['r1'] : [] }))
        .activePlayerId,
    ).toBe('b');
  },
);
it('copie le choix et ne redresse pas une rune recyclée en réaction', () => {
  const ids = ['r1', 'r3'];
  let s = step(fixture(), { ...end, readyRuneIds: ids });
  ids[0] = 'r2';
  s.cards = s.cards.map((c) =>
    c.id === 'r1' ? { ...c, zoneId: 'rune-pile-a' } : c,
  );
  s = resolve(s);
  expect(s.cards.find((c) => c.id === 'r1')!.ready).toBe(false);
  expect(s.cards.find((c) => c.id === 'r2')!.ready).toBe(false);
  expect(s.cards.find((c) => c.id === 'r3')!.ready).toBe(true);
});
