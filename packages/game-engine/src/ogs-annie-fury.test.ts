import { expect, it } from 'vitest';
import {
  annieFury,
  incinerate,
  gentlemensDuel,
  defineUnit,
  defineSpell,
} from '../../game-data/src/index.js';
import { act, type GameState, type GameAction } from './index.js';
import { combatPower } from './combat/allocation.js';

function fixture(): GameState {
  return {
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    unitDefinitions: [annieFury],
    spellDefinitions: [incinerate, gentlemensDuel],
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
        id: 'annie',
        definitionId: annieFury.id,
        ownerId: 'a',
        zoneId: 'base-a',
        might: 4,
        damage: 0,
        ready: false,
      },
      {
        id: 'enemy',
        definitionId: 'fixture',
        ownerId: 'b',
        zoneId: 'field',
        might: 10,
        damage: 0,
        ready: true,
      },
    ],
    cards: [annieFury, incinerate, gentlemensDuel].map((d) => ({
      id: d.id,
      definitionId: d.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    })),
    resources: { a: { energy: 10, power: { rouge: 1, orange: 1 } } },
    battlefields: [{ zoneId: 'field', controllerId: 'b' }],
    scoredBattlefields: {},
    showdown: null,
  };
}
function step(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r;
}
function cast(s: GameState, id = incinerate.id) {
  return step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: id,
    targetId: 'enemy',
    payment: { energyRunes: [], powerRunes: [] },
  }).state;
}
function resolve(s: GameState) {
  s = step(s, { type: 'pass', playerId: 'a' }).state;
  return step(s, { type: 'pass', playerId: 'b' });
}

it('Annie en base, Tap et Stun augmente Incinerate de 2 à 3', () => {
  const s = fixture();
  s.units[0]!.temporaryEffects = [{ type: 'stun' }];
  const r = resolve(cast(s));
  expect(r.state.units[1]?.damage).toBe(3);
  expect(r.events.find((e) => e.type === 'spell-damage')).toMatchObject({
    amount: 3,
  });
  expect(s.units[1]?.damage).toBe(0);
});

it('cumule deux Annie alliées mais exclut l’Annie adverse et les cartes en main', () => {
  const s = fixture();
  s.units.push({ ...s.units[0]!, id: 'annie-2', zoneId: 'field' });
  s.units.push({
    ...s.units[0]!,
    id: 'enemy-annie',
    ownerId: 'b',
    zoneId: 'base-b',
  });
  expect(resolve(cast(s)).state.units[1]?.damage).toBe(4);
});

it('recalcule à la résolution si Annie a quitté le plateau', () => {
  const s = cast(fixture());
  s.units = s.units.filter((u) => u.id !== 'annie');
  expect(resolve(s).state.units[0]?.damage).toBe(2);
});

it('ajoute le bonus à chaque instance de dégâts, sans créer de fenêtre intermédiaire', () => {
  const s = fixture();
  const twice = defineSpell({
    ...incinerate,
    id: 'twice',
    effects: [
      { type: 'damage', amount: 2 },
      { type: 'damage', amount: 2 },
    ],
  });
  s.spellDefinitions = [twice];
  s.cards.push({
    id: twice.id,
    definitionId: twice.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  const r = resolve(cast(s, twice.id));
  expect(r.state.units[1]?.damage).toBe(6);
  expect(
    r.events.filter((e) => e.type === 'spell-damage').map((e) => e.amount),
  ).toEqual([3, 3]);
  expect(r.state.stack).toBeNull();
});

it('n’augmente ni les dégâts de combat ni ceux du duel', () => {
  const s = fixture();
  expect(combatPower([s.units[0]!], s)).toBe(4);
  const paid = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: gentlemensDuel.id,
    targetId: 'annie',
    secondaryTargetId: 'enemy',
    payment: { energyRunes: [], powerRunes: [] },
  }).state;
  const r = resolve(paid);
  expect(
    r.events.filter((e) => e.type === 'unit-damage').map((e) => e.amount),
  ).toEqual([7, 10]);
  expect(r.state.units.find((u) => u.id === 'enemy')?.damage).toBe(7);
});

it('se joue Tap pour 5 énergie et 1 rouge, avec 4 Might', () => {
  const s = fixture();
  s.units = [];
  const r = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: annieFury.id,
    payment: { energyRunes: [], powerRunes: [] },
  });
  expect(r.state.units[0]).toMatchObject({
    might: 4,
    ready: false,
    zoneId: 'base-a',
  });
  expect(r.state.resources.a).toMatchObject({ energy: 5, power: { rouge: 0 } });
});

it('refuse un bonus imprimé négatif ou non fini', () => {
  for (const amount of [-1, NaN, Infinity])
    expect(() =>
      defineUnit({ ...annieFury, spellAbilityDamageBonus: amount }),
    ).toThrow(RangeError);
});
