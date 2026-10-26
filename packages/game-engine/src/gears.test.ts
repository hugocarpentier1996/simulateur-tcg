import { describe, expect, it } from 'vitest';
import {
  act,
  createGame,
  effectiveMight,
  type GameAction,
  type GameState,
} from './index.js';
import { testGears, testSpells } from '../../game-data/src/index.js';
import { withDrawSupplies } from './test-fixtures.js';

function scenario(): GameState {
  return withDrawSupplies({
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    gearDefinitions: testGears,
    spellDefinitions: testSpells,
    zones: [
      ...['a', 'b'].flatMap((ownerId) => [
        { id: `base-${ownerId}`, kind: 'base' as const, ownerId },
        { id: `grave-${ownerId}`, kind: 'graveyard' as const, ownerId },
      ]),
      { id: 'field', kind: 'battlefield' },
    ],
    cards: ['banner', 'blade', 'test-reposition'].map((id) => ({
      id,
      definitionId: id,
      ownerId: 'a',
      zoneId: 'hand-a',
    })),
    units: [
      {
        id: 'ua',
        definitionId: 'unit',
        ownerId: 'a',
        zoneId: 'base-a',
        ready: true,
        might: 1,
        damage: 0,
      },
      {
        id: 'ua2',
        definitionId: 'unit',
        ownerId: 'a',
        zoneId: 'base-a',
        ready: false,
        might: 0,
        damage: 0,
      },
      {
        id: 'ub',
        definitionId: 'unit',
        ownerId: 'b',
        zoneId: 'base-b',
        ready: true,
        might: 4,
        damage: 0,
      },
    ],
    resources: {
      a: { energy: 20, power: { 'color-1': 20, 'color-2': 20 } },
      b: { energy: 20, power: {} },
    },
    battlefields: [{ zoneId: 'field', controllerId: null }],
    scoredBattlefields: {},
    showdown: null,
  });
}
const payment = { energyRunes: [], powerRunes: [] };
function apply(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}
function play(s: GameState, id: string) {
  return apply(s, { type: 'play-gear', playerId: 'a', cardId: id, payment });
}
function equipped(): GameState {
  return apply(play(scenario(), 'blade'), {
    type: 'equip-gear',
    playerId: 'a',
    gearId: 'blade',
    unitId: 'ua',
    payment,
  });
}
function combat(s: GameState): GameState {
  return {
    ...s,
    units: s.units.map((u) =>
      u.id === 'ua' || u.id === 'ub' ? { ...u, zoneId: 'field' } : u,
    ),
    showdown: {
      kind: 'combat',
      battlefieldId: 'field',
      initiatorId: 'a',
      defenderId: 'b',
      participants: ['a', 'b'],
      priorityPlayerId: 'a',
      consecutivePasses: 0,
      stage: 'damage',
      assignments: {},
    },
    battlefields: [{ zoneId: 'field', controllerId: 'b' }],
  };
}

describe('gears et équipements', () => {
  it('transmet le catalogue de gears à une partie créée depuis une configuration', () => {
    const gearDefinitions = scenario().gearDefinitions!;
    const result = createGame({
      gearDefinitions,
      players: ['a', 'b'].map((id) => ({
        id,
        deck: Array.from({ length: 39 }, (_, i) => ({
          id: `${id}-card-${i}`,
          definitionId: i === 0 ? 'banner' : 'unit',
        })),
        runes: Array.from({ length: 12 }, (_, i) => ({
          id: `${id}-rune-${i}`,
          definitionId: 'rune',
          color: 'rouge',
        })),
        legend: {
          id: `${id}-legend`,
          definitionId: 'legend',
          colors: ['rouge', 'bleu'],
        },
        champion: { id: `${id}-champion`, definitionId: 'champion' },
        battlefields: [0, 1, 2].map((i) => ({
          id: `${id}-field-${i}`,
          definitionId: `field-${i}`,
        })),
      })),
    });
    if (!result.ok) throw new Error(result.reason);
    expect(result.state.gearDefinitions).toEqual(gearDefinitions);
  });
  it('conserve une unité grâce à son aura et cumule équipement, aura et bonus temporaire avant le plancher zéro', () => {
    let s = play(equipped(), 'banner');
    s.units[0]!.temporaryEffects = [{ type: 'modify-might', amount: -3 }];
    expect(effectiveMight(s.units[0]!, s)).toBe(1);
    s = combat(s);
    s.units[0]!.temporaryEffects = [];
    s.units[2]!.might = 3;
    s = apply(s, {
      type: 'assign-damage',
      playerId: 'a',
      allocations: [{ targetId: 'ub', amount: 3 }],
    });
    s = apply(s, {
      type: 'assign-damage',
      playerId: 'b',
      allocations: [{ targetId: 'ua', amount: 3 }],
    });
    expect(s.units.find((u) => u.id === 'ua')).toMatchObject({
      damage: 0,
      zoneId: 'field',
    });
    expect(s.units.some((u) => u.id === 'ub')).toBe(false);
    expect(s.gears?.find((g) => g.id === 'blade')).toMatchObject({
      attachedUnitId: 'ua',
      zoneId: 'field',
    });
  });
  it('paie le gear, le pose Ready en base et applique son aura sans créer d’unité', () => {
    const input = scenario();
    const before = structuredClone(input);
    const s = play(input, 'banner');
    expect(s.gears?.[0]).toMatchObject({
      id: 'banner',
      zoneId: 'base-a',
      ready: true,
    });
    expect(s.cards.some((c) => c.id === 'banner')).toBe(false);
    expect(s.units).toHaveLength(3);
    expect(s.resources.a?.energy).toBe(18);
    expect(effectiveMight(s.units[0]!, s)).toBe(2);
    expect(effectiveMight(s.units[1]!, s)).toBe(1);
    expect(effectiveMight(s.units[2]!, s)).toBe(4);
    expect(input).toEqual(before);
  });
  it('cumule les auras sur les unités nouvelles et cesse le bonus quand le gear quitte le jeu', () => {
    let s = play(scenario(), 'banner');
    s.cards.push({
      id: 'banner2',
      definitionId: 'banner',
      ownerId: 'a',
      zoneId: 'hand-a',
    });
    s = play(s, 'banner2');
    s.units.push({
      id: 'new',
      definitionId: 'unit',
      ownerId: 'a',
      zoneId: 'field',
      ready: false,
      might: 2,
      damage: 0,
    });
    expect(effectiveMight(s.units.at(-1)!, s)).toBe(4);
    expect(s.units[0]?.might).toBe(1);
    s.gears = s.gears!.slice(1);
    expect(effectiveMight(s.units.at(-1)!, s)).toBe(3);
  });
  it('paie séparément pose et attachement, garde Ready et persiste après la fin du tour', () => {
    const input = play(scenario(), 'blade');
    expect(effectiveMight(input.units[0]!, input)).toBe(1);
    let s = apply(input, {
      type: 'equip-gear',
      playerId: 'a',
      gearId: 'blade',
      unitId: 'ua',
      payment,
    });
    expect(s.resources.a?.energy).toBe(input.resources.a!.energy - 1);
    expect(s.resources.a?.power['color-1']).toBe(
      input.resources.a!.power['color-1']! - 1,
    );
    expect(s.gears?.[0]).toMatchObject({ attachedUnitId: 'ua', ready: true });
    expect(effectiveMight(s.units[0]!, s)).toBe(3);
    s = apply(s, { type: 'end-turn', playerId: 'a' });
    expect(effectiveMight(s.units[0]!, s)).toBe(3);
  });
  it('refuse le rééquipement tant que le porteur vit, même vers le même porteur', () => {
    const s = equipped();
    const before = structuredClone(s);
    for (const unitId of ['ua', 'ua2'])
      expect(
        act(s, {
          type: 'equip-gear',
          playerId: 'a',
          gearId: 'blade',
          unitId,
          payment,
        }).ok,
      ).toBe(false);
    expect(s).toEqual(before);
  });
  it('refuse mauvais timing, cible adverse, gear sans équipement et paiement insuffisant', () => {
    const s = play(play(scenario(), 'blade'), 'banner');
    expect(
      act(s, {
        type: 'equip-gear',
        playerId: 'a',
        gearId: 'blade',
        unitId: 'ub',
        payment,
      }).ok,
    ).toBe(false);
    expect(
      act(s, {
        type: 'equip-gear',
        playerId: 'a',
        gearId: 'banner',
        unitId: 'ua',
        payment,
      }).ok,
    ).toBe(false);
    expect(
      act(combat(s), {
        type: 'equip-gear',
        playerId: 'a',
        gearId: 'blade',
        unitId: 'ua',
        payment,
      }).ok,
    ).toBe(false);
    const poor = {
      ...s,
      resources: { ...s.resources, a: { energy: 0, power: {} } },
    };
    const before = structuredClone(poor);
    expect(
      act(poor, {
        type: 'equip-gear',
        playerId: 'a',
        gearId: 'blade',
        unitId: 'ua',
        payment,
      }).ok,
    ).toBe(false);
    expect(poor).toEqual(before);
    const input = scenario();
    input.resources.a = { energy: 0, power: {} };
    expect(
      act(input, {
        type: 'play-gear',
        playerId: 'a',
        cardId: 'banner',
        payment,
      }).ok,
    ).toBe(false);
    expect(
      act(combat(scenario()), {
        type: 'play-gear',
        playerId: 'a',
        cardId: 'banner',
        payment,
      }).ok,
    ).toBe(false);
  });
  it('interdit le mouvement et les sorts de déplacement ciblant directement un gear', () => {
    const s = equipped();
    expect(
      act(s, {
        type: 'move',
        playerId: 'a',
        unitId: 'blade',
        destinationId: 'field',
      }).ok,
    ).toBe(false);
    expect(
      act(s, {
        type: 'cast-spell',
        playerId: 'a',
        cardId: 'test-reposition',
        targetId: 'blade',
        destinationId: 'field',
        payment,
      }).ok,
    ).toBe(false);
  });
  it('suit le porteur lors du mouvement normal puis du déplacement par sort sans Tap', () => {
    let s = equipped();
    s.battlefields[0]!.controllerId = 'a';
    s = apply(s, {
      type: 'move',
      playerId: 'a',
      unitId: 'ua',
      destinationId: 'field',
    });
    expect(s.gears?.[0]).toMatchObject({
      zoneId: 'field',
      ready: true,
      attachedUnitId: 'ua',
    });
    s = apply(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'test-reposition',
      targetId: 'ua',
      destinationId: 'base-a',
      payment,
    });
    for (const playerId of ['a', 'b']) s = apply(s, { type: 'pass', playerId });
    expect(s.gears?.[0]).toMatchObject({
      zoneId: 'base-a',
      ready: true,
      attachedUnitId: 'ua',
    });
  });
  it('utilise le bonus dans les dégâts et la mort, puis rend l’équipement réutilisable en base', () => {
    let s = combat(equipped());
    expect(
      act(s, {
        type: 'assign-damage',
        playerId: 'a',
        allocations: [{ targetId: 'ub', amount: 1 }],
      }).ok,
    ).toBe(false);
    expect(
      act(s, {
        type: 'assign-damage',
        playerId: 'b',
        allocations: [{ targetId: 'blade', amount: 4 }],
      }).ok,
    ).toBe(false);
    s = apply(s, {
      type: 'assign-damage',
      playerId: 'a',
      allocations: [{ targetId: 'ub', amount: 3 }],
    });
    s = apply(s, {
      type: 'assign-damage',
      playerId: 'b',
      allocations: [{ targetId: 'ua', amount: 3 }],
    });
    expect(s.units.some((u) => u.id === 'ua')).toBe(false);
    expect(s.cards.find((c) => c.id === 'ua')?.zoneId).toBe('grave-a');
    expect(s.gears?.[0]).toMatchObject({ zoneId: 'base-a', ready: true });
    expect(s.gears?.[0]?.attachedUnitId).toBeUndefined();
    s = apply(s, {
      type: 'equip-gear',
      playerId: 'a',
      gearId: 'blade',
      unitId: 'ua2',
      payment,
    });
    expect(
      effectiveMight(
        s.units.find((u) => u.id === 'ua2')!,
        s,
      ),
    ).toBe(2);
  });
  it('suit la retraite du porteur vivant et reste attaché', () => {
    let s = combat(equipped());
    s.units = s.units.map((u) => ({ ...u, stunned: true }));
    for (const playerId of ['a', 'b'])
      s = apply(s, { type: 'assign-damage', playerId, allocations: [] });
    expect(s.gears?.[0]).toMatchObject({
      zoneId: 'base-a',
      attachedUnitId: 'ua',
    });
  });
  it('redresse les gears du joueur à Awaken sans leur attribuer de contrôle', () => {
    let s = equipped();
    s.gears![0]!.ready = false;
    s = apply(s, { type: 'end-turn', playerId: 'a' });
    expect(s.gears?.[0]?.ready).toBe(false);
    s = apply(s, { type: 'end-turn', playerId: 'b' });
    expect(s.gears?.[0]?.ready).toBe(true);
    expect(s.battlefields[0]?.controllerId).toBeNull();
  });
});
