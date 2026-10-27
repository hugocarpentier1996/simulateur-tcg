import { expect, it } from 'vitest';
import { garenOrder, defineUnit } from '../../game-data/src/index.js';
import { act, effectiveMight, type GameState } from './index.js';

function fixture(): GameState {
  return {
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    unitDefinitions: [garenOrder],
    zones: [
      { id: 'field', kind: 'battlefield' },
      ...['a', 'b'].flatMap((ownerId) =>
        (['base', 'hand', 'graveyard'] as const).map((kind) => ({
          id: `${kind}-${ownerId}`,
          kind,
          ownerId,
        })),
      ),
    ],
    units: [
      {
        id: 'garen',
        definitionId: garenOrder.id,
        ownerId: 'a',
        zoneId: 'base-a',
        might: 5,
        damage: 0,
        ready: true,
      },
      {
        id: 'friend',
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'base-a',
        might: 2,
        damage: 0,
        ready: true,
      },
      {
        id: 'away',
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'field',
        might: 2,
        damage: 0,
        ready: true,
      },
      {
        id: 'enemy',
        definitionId: 'fixture',
        ownerId: 'b',
        zoneId: 'base-a',
        might: 2,
        damage: 0,
        ready: true,
      },
    ],
    cards: [
      {
        id: 'card',
        definitionId: garenOrder.id,
        ownerId: 'a',
        zoneId: 'hand-a',
      },
    ],
    resources: { a: { energy: 6, power: { jaune: 1 } } },
    battlefields: [{ zoneId: 'field', controllerId: 'a' }],
    scoredBattlefields: {},
    showdown: null,
  };
}

it('aide seulement les autres alliés présents dans sa zone, même Tap et Stun', () => {
  const s = fixture();
  s.units[0]!.ready = false;
  s.units[0]!.temporaryEffects = [{ type: 'stun' }];
  expect(s.units.map((u) => effectiveMight(u, s))).toEqual([5, 3, 2, 2]);
});

it('recalcule l’aura après un vrai déplacement de Garen', () => {
  const s = fixture();
  const moved = act(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'garen',
    destinationId: 'field',
  });
  if (!moved.ok) throw new Error(moved.reason);
  expect(moved.state.units.map((u) => effectiveMight(u, moved.state))).toEqual([
    5, 2, 3, 2,
  ]);
  expect(effectiveMight(s.units[1]!, s)).toBe(3);
});

it('deux Garen se renforcent mutuellement et cumulent leur aura sur un tiers', () => {
  const s = fixture();
  s.units.push({ ...s.units[0]!, id: 'garen-2' });
  expect(effectiveMight(s.units[0]!, s)).toBe(6);
  expect(effectiveMight(s.units[4]!, s)).toBe(6);
  expect(effectiveMight(s.units[1]!, s)).toBe(4);
});

it('se joue Tap pour 6 énergie et 1 jaune et applique aussitôt son aura', () => {
  const s = fixture();
  s.units = s.units.filter((u) => u.id !== 'garen');
  const played = act(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'card',
    payment: { energyRunes: [], powerRunes: [] },
  });
  if (!played.ok) throw new Error(played.reason);
  expect(played.state.units.find((u) => u.id === 'card')).toMatchObject({
    ready: false,
    zoneId: 'base-a',
    might: 5,
  });
  expect(effectiveMight(played.state.units[0]!, played.state)).toBe(3);
  expect(played.state.resources.a).toEqual({ energy: 0, power: { jaune: 0 } });
});

it('protège un allié pendant les dégâts simultanés puis cesse à la mort de Garen', () => {
  let s = fixture();
  s.units = s.units.filter((u) => u.id !== 'away');
  for (const u of s.units) u.zoneId = 'field';
  s.units.find((u) => u.id === 'enemy')!.might = 7;
  s.battlefields[0]!.controllerId = 'b';
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
  const attack = act(s, {
    type: 'assign-damage',
    playerId: 'a',
    allocations: [{ targetId: 'enemy', amount: 7 }],
  });
  if (!attack.ok) throw new Error(attack.reason);
  const defense = act(attack.state, {
    type: 'assign-damage',
    playerId: 'b',
    allocations: [
      { targetId: 'garen', amount: 5 },
      { targetId: 'friend', amount: 2 },
    ],
  });
  if (!defense.ok) throw new Error(defense.reason);
  expect(defense.state.units).toHaveLength(1);
  expect(defense.state.units[0]).toMatchObject({ id: 'friend', damage: 0 });
  expect(effectiveMight(defense.state.units[0]!, defense.state)).toBe(2);
  expect(defense.state.players[0]?.score).toBe(1);
});

it('refuse une aura imprimée négative ou non finie', () => {
  for (const amount of [-1, NaN, Infinity])
    expect(() =>
      defineUnit({ ...garenOrder, otherAlliesHereMightBonus: amount }),
    ).toThrow(RangeError);
});
