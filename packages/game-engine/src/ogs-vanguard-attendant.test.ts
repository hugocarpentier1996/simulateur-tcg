import { expect, it } from 'vitest';
import { vanguardAttendant } from '../../game-data/src/ogs/vanguard-attendant.js';
import { act, getLegalActions, type GameState } from './index.js';

function scenario(): GameState {
  return {
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    unitDefinitions: [vanguardAttendant],
    zones: [
      { id: 'hand', kind: 'hand', ownerId: 'a' },
      { id: 'base', kind: 'base', ownerId: 'a' },
      { id: 'runes', kind: 'runes', ownerId: 'a' },
      { id: 'pile', kind: 'rune-pile', ownerId: 'a' },
      { id: 'home', kind: 'battlefield' },
      { id: 'neutral', kind: 'battlefield' },
    ],
    cards: [
      {
        id: 'vanguard',
        definitionId: vanguardAttendant.id,
        ownerId: 'a',
        zoneId: 'hand',
      },
      ...Array.from({ length: 6 }, (_, i) => ({
        id: `r${i}`,
        definitionId: 'rune',
        ownerId: 'a',
        zoneId: 'runes',
        color: i === 0 ? 'jaune' : 'bleu',
        ready: true,
      })),
    ],
    units: [
      {
        id: 'ally',
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'home',
        ready: true,
        might: 1,
        damage: 0,
      },
    ],
    resources: { a: { energy: 0, power: {} } },
    battlefields: [
      { zoneId: 'home', controllerId: 'a' },
      { zoneId: 'neutral', controllerId: null },
    ],
    scoredBattlefields: {},
    showdown: null,
  };
}
const payment = {
  energyRunes: Array.from({ length: 6 }, (_, i) => `r${i}`),
  powerRunes: ['r0'],
};

it.each(['base', 'home'])(
  'Vanguard Attendant paie 6 énergie et 1 jaune puis entre Ready dans %s',
  (destinationId) => {
    expect(vanguardAttendant.cost).toEqual({ energy: 6, power: { jaune: 1 } });
    const input = scenario();
    const before = structuredClone(input);
    const played = act(input, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'vanguard',
      destinationId,
      payment,
    });
    expect(played.ok).toBe(true);
    if (!played.ok) throw new Error(played.reason);
    expect(played.state.units.find((u) => u.id === 'vanguard')).toMatchObject({
      ready: true,
      might: 5,
      damage: 0,
      zoneId: destinationId,
    });
    expect(played.state.cards.find((c) => c.id === 'r0')?.zoneId).toBe('pile');
    expect(
      played.state.cards
        .filter((c) => c.zoneId === 'runes')
        .every((c) => !c.ready),
    ).toBe(true);
    expect(input).toEqual(before);
    if (destinationId === 'base') {
      expect(getLegalActions(played.state, 'a')).toContainEqual({
        type: 'move',
        playerId: 'a',
        unitId: 'vanguard',
        destinationId: 'neutral',
      });
      const moved = act(played.state, {
        type: 'move',
        playerId: 'a',
        unitId: 'vanguard',
        destinationId: 'neutral',
      });
      if (!moved.ok) throw new Error(moved.reason);
      expect(moved.state.units.find((u) => u.id === 'vanguard')?.ready).toBe(
        false,
      );
      expect(moved.state.showdown?.kind).toBe('open');
    }
  },
);

it('l’arrivée Ready ne contourne ni le coût, ni la couleur, ni la destination', () => {
  const input = scenario();
  const before = structuredClone(input);
  for (const action of [
    {
      destinationId: 'base',
      payment: { energyRunes: ['r0'], powerRunes: ['r0'] },
    },
    { destinationId: 'base', payment: { ...payment, powerRunes: ['r1'] } },
    { destinationId: 'neutral', payment },
  ])
    expect(
      act(input, {
        type: 'play-unit',
        playerId: 'a',
        cardId: 'vanguard',
        ...action,
      }).ok,
    ).toBe(false);
  expect(input).toEqual(before);
});
