import { expect, it } from 'vitest';
import * as engine from './index.js';
import { annieFury } from '../../game-data/src/index.js';

function fixture(): engine.GameState {
  return {
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    showdown: null,
    zones: [
      { id: 'f', kind: 'battlefield' },
      { id: 'g', kind: 'battlefield' },
      { id: 'base-a', kind: 'base', ownerId: 'a' },
    ],
    battlefields: [
      { zoneId: 'f', controllerId: 'b' },
      { zoneId: 'g', controllerId: null },
    ],
    scoredBattlefields: {},
    resources: {},
    cards: [],
    units: [
      ['a1', 'a', 'f'],
      ['b1', 'b', 'f'],
      ['b2', 'b', 'g'],
      ['a2', 'a', 'base-a'],
    ].map(([id, ownerId, zoneId]) => ({
      id: id!,
      ownerId: ownerId!,
      zoneId: zoneId!,
      definitionId: 'fixture',
      might: 8,
      damage: 0,
      ready: true,
    })),
  };
}
it('représente un côté par champ et joueur, indépendamment du contrôleur', () => {
  const s = fixture();
  expect(engine.getBattlefieldSides(s, 'f')).toEqual([
    { kind: 'battlefield-side', battlefieldId: 'f', playerId: 'a' },
    { kind: 'battlefield-side', battlefieldId: 'f', playerId: 'b' },
  ]);
  expect(engine.getUnitLocation(s, 'a1')).toEqual({
    kind: 'battlefield-side',
    battlefieldId: 'f',
    playerId: 'a',
  });
  s.battlefields[0]!.controllerId = 'a';
  expect(engine.getUnitLocation(s, 'b1')).toEqual({
    kind: 'battlefield-side',
    battlefieldId: 'f',
    playerId: 'b',
  });
  expect(engine.getUnitLocation(s, 'a2')).toEqual({
    kind: 'zone',
    zoneId: 'base-a',
  });
  expect(engine.getUnitLocation(s, 'absent')).toBeNull();
});
it('sélectionne plusieurs côtés ou champs sans compter deux fois une unité', () => {
  const s = fixture();
  expect(
    engine
      .unitsInBattlefieldAreas(s, [
        { kind: 'battlefield-side', battlefieldId: 'f', playerId: 'b' },
        { kind: 'battlefield', battlefieldId: 'g' },
      ])
      .map((u) => u.id),
  ).toEqual(['b1', 'b2']);
  expect(
    engine
      .unitsInBattlefieldAreas(s, [
        { kind: 'battlefield', battlefieldId: 'f' },
        { kind: 'battlefield-side', battlefieldId: 'f', playerId: 'b' },
      ])
      .map((u) => u.id),
  ).toEqual(['a1', 'b1']);
  expect(engine.getBattlefieldSides(s, 'base-a')).toEqual([]);
  s.battlefields = [];
  expect(
    engine.unitsInBattlefieldAreas(s, [
      { kind: 'battlefield', battlefieldId: 'f' },
    ]),
  ).toEqual([]);
});
it('dégâts de zone : portée explicite, bonus partagé et source conservée', () => {
  const s = fixture();
  s.unitDefinitions = [annieFury];
  s.units[3]!.definitionId = annieFury.id;
  const result = engine.dealAreaDamage(
    s,
    { kind: 'ability', sourceId: 'source', playerId: 'a' },
    [
      { kind: 'battlefield', battlefieldId: 'f' },
      { kind: 'battlefield-side', battlefieldId: 'f', playerId: 'b' },
    ],
    2,
  );
  expect(result.state.units.map((u) => u.damage)).toEqual([3, 3, 0, 0]);
  expect(result.events.map((e) => e.type)).toEqual([
    'ability-damage',
    'ability-damage',
  ]);
  expect(s.units.every((u) => u.damage === 0)).toBe(true);
});
it('le mouvement met à jour le côté dérivé et conserve le battlefield du combat', () => {
  const s = fixture();
  const r = engine.act(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'a2',
    destinationId: 'f',
  });
  expect(r.ok).toBe(true);
  if (!r.ok) throw new Error(r.reason);
  expect(engine.getUnitLocation(r.state, 'a2')).toEqual({
    kind: 'battlefield-side',
    battlefieldId: 'f',
    playerId: 'a',
  });
  expect(r.state.showdown).toMatchObject({
    kind: 'combat',
    battlefieldId: 'f',
    defenderId: 'b',
  });
  expect(r.state.battlefields[0]!.controllerId).toBe('b');
});
it('les côtés sont extensibles au nombre de joueurs et existent même vides', () => {
  const s = fixture();
  s.players.push({ id: 'c', score: 0 });
  s.units = [];
  expect(
    engine.getBattlefieldSides(s, 'g').map((side) => side.playerId),
  ).toEqual(['a', 'b', 'c']);
});
