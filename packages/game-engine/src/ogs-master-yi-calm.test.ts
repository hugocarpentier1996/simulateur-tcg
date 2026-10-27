import { expect, it } from 'vitest';
import { masterYiCalm, defineUnit } from '../../game-data/src/index.js';
import { act, effectiveMight, type GameState } from './index.js';

function fixture(count: number): GameState {
  return {
    phase: 'main',
    activePlayerId: 'a',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    zones: [
      ...['a', 'b'].flatMap((ownerId) =>
        (['base', 'hand', 'runes', 'rune-pile', 'graveyard'] as const).map(
          (kind) => ({ id: `${kind}-${ownerId}`, kind, ownerId }),
        ),
      ),
      { id: 'field', kind: 'battlefield' },
    ],
    unitDefinitions: [masterYiCalm],
    units: [
      {
        id: 'yi',
        definitionId: masterYiCalm.id,
        ownerId: 'a',
        zoneId: 'base-a',
        ready: false,
        might: 4,
        damage: 0,
      },
    ],
    cards: [
      ...Array.from({ length: count }, (_, i) => ({
        id: `rune-${i}`,
        definitionId: 'rune',
        ownerId: 'a',
        zoneId: 'runes-a',
        color: 'vert',
        ready: i % 2 === 0,
      })),
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `reserve-${i}`,
        definitionId: 'rune',
        ownerId: 'a',
        zoneId: 'rune-pile-a',
        color: 'vert',
        ready: false,
      })),
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `enemy-${i}`,
        definitionId: 'rune',
        ownerId: 'b',
        zoneId: 'runes-b',
        color: 'vert',
        ready: true,
      })),
      {
        id: 'card',
        definitionId: masterYiCalm.id,
        ownerId: 'a',
        zoneId: 'hand-a',
      },
    ],
    resources: { a: { energy: 5, power: {} } },
    battlefields: [{ zoneId: 'field', controllerId: 'b' }],
    scoredBattlefields: {},
    showdown: null,
  };
}

it.each([
  [7, 4],
  [8, 8],
  [9, 8],
])(
  'avec %i runes propres en jeu, Might vaut %i (Ready et Tap)',
  (count, might) => {
    const s = fixture(count);
    expect(effectiveMight(s.units[0]!, s)).toBe(might);
    s.units[0]!.zoneId = 'field';
    expect(effectiveMight(s.units[0]!, s)).toBe(might);
  },
);

it('recalcule le bonus après paiement en Power : 8 runes deviennent 7 ; arrivée Tap', () => {
  const s = fixture(8);
  expect(effectiveMight(s.units[0]!, s)).toBe(8);
  const result = act(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'card',
    payment: { energyRunes: [], powerRunes: ['rune-1'] },
  });
  if (!result.ok) throw new Error(result.reason);
  expect(result.state.units).toHaveLength(2);
  for (const unit of result.state.units)
    expect(effectiveMight(unit, result.state)).toBe(4);
  expect(result.state.units[1]).toMatchObject({
    ready: false,
    zoneId: 'base-a',
    might: 4,
  });
  expect(result.state.resources.a).toEqual({ energy: 0, power: { vert: 0 } });
  expect(effectiveMight(s.units[0]!, s)).toBe(8);
});

it('utilise le bonus pour les dégâts et le seuil de mort en combat', () => {
  let s = fixture(8);
  s.units[0]!.zoneId = 'field';
  s.units.push({
    id: 'enemy',
    definitionId: 'fixture',
    ownerId: 'b',
    zoneId: 'field',
    ready: false,
    might: 7,
    damage: 0,
  });
  s.showdown = {
    kind: 'combat',
    battlefieldId: 'field',
    initiatorId: 'a',
    defenderId: 'b',
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
    stage: 'priority',
    assignments: {},
  };
  for (const playerId of ['a', 'b']) {
    const r = act(s, { type: 'pass', playerId });
    if (!r.ok) throw new Error(r.reason);
    s = r.state;
  }
  for (const [playerId, targetId] of [
    ['a', 'enemy'],
    ['b', 'yi'],
  ] as const) {
    const r = act(s, {
      type: 'assign-damage',
      playerId,
      allocations: [{ targetId, amount: 7 }],
    });
    if (!r.ok) throw new Error(r.reason);
    s = r.state;
  }
  expect(s.units).toHaveLength(1);
  expect(s.units[0]).toMatchObject({ id: 'yi', damage: 0 });
  expect(s.players[0]?.score).toBe(1);
});

it('fige le bonus imprimé et refuse ses valeurs invalides', () => {
  const bonus = { minimum: 8, amount: 4 };
  const definition = defineUnit({ ...masterYiCalm, runeMightBonus: bonus });
  bonus.amount = 99;
  expect(definition.runeMightBonus?.amount).toBe(4);
  expect(Object.isFrozen(definition.runeMightBonus)).toBe(true);
  for (const invalid of [
    { minimum: 1.5, amount: 4 },
    { minimum: -1, amount: 4 },
    { minimum: 8, amount: NaN },
  ])
    expect(() =>
      defineUnit({ ...masterYiCalm, runeMightBonus: invalid }),
    ).toThrow(RangeError);
});
