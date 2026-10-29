import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import {
  gust,
  poutyPoro,
  annieFury,
  testSpells,
} from '../../game-data/src/index.js';
import { act } from './act.js';
import { getLegalActions } from './legal/actions.js';
import type { GameState } from './types.js';
import { crackshotCorsair } from '../../game-data/src/index.js';
function setup(): GameState {
  const s = spellScenario(gust);
  s.unitDefinitions = [crackshotCorsair, poutyPoro, annieFury];
  s.units[0]!.definitionId = crackshotCorsair.id;
  s.units[0]!.zoneId = 'base-a';
  s.units[1]!.ready = false;
  return s;
}
const move = {
  type: 'move' as const,
  playerId: 'a',
  unitId: 'ally',
  destinationId: 'g',
};
const choose = {
  type: 'choose-attack-targets' as const,
  playerId: 'a',
  effects: [{ sourceId: 'ally', targetId: 'enemy', payment: noRunes }],
};
it('plusieurs Corsairs choisissent leur ordre avec un budget Deflect partagé et refus atomique', () => {
  let s = setup();
  const reposition = testSpells[0]!;
  s.spellDefinitions = [reposition];
  s.cards[0]!.definitionId = reposition.id;
  s.resources.a!.power = { 'color-1': 1, vert: 2 };
  s.units[0]!.zoneId = 'g';
  s.units.push({ ...s.units[0]!, id: 'second' });
  s.units[1]!.zoneId = 'base-b';
  s.units[1]!.definitionId = poutyPoro.id;
  s.showdown = {
    kind: 'open',
    battlefieldId: 'g',
    initiatorId: 'a',
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      destinationId: 'g',
      payment: noRunes,
    }),
  );
  expect(s.pendingAttackChoices).toHaveLength(2);
  const invalid = {
    ...choose,
    effects: [
      { sourceId: 'second', targetId: 'enemy', payment: noRunes },
      { sourceId: 'ally', targetId: 'enemy', payment: noRunes },
    ],
  };
  expect(act(s, invalid).ok).toBe(false);
  expect(s.resources.a!.power.vert).toBe(1);
  const valid = {
    ...choose,
    effects: [
      { sourceId: 'second', targetId: 'enemy', payment: noRunes },
      { sourceId: 'ally', payment: noRunes },
    ],
  };
  expect(getLegalActions(s, 'a')).toContainEqual(valid);
  s = step(s, valid);
  expect(s.resources.a!.power.vert).toBe(0);
  expect(s.stack?.entries.at(-1)).toMatchObject({ sourceId: 'ally' });
  s = resolveTop(s);
  s = resolveTop(s);
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(1);
});
it('Corsair choisit avant les réactions, puis inflige des dégâts de capacité avec bonus Annie', () => {
  let s = setup();
  s.units.push({ ...s.units[0]!, id: 'annie', definitionId: annieFury.id });
  s = step(s, move);
  expect(s.pendingAttackChoices).toHaveLength(1);
  expect(act(s, { type: 'pass', playerId: 'a' }).ok).toBe(false);
  expect(getLegalActions(s, 'a')).toContainEqual(choose);
  expect(
    act(s, {
      ...choose,
      effects: [{ sourceId: 'ally', targetId: 'ally', payment: noRunes }],
    }).ok,
  ).toBe(false);
  s = step(s, choose);
  expect(s.units[1]!.damage).toBe(0);
  s = resolveTop(s);
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(2);
  expect(s.pendingAttackChoices).toBeFalsy();
});
it.each(['target-left', 'source-gust'])(
  'réactions après choix : %s',
  (mode) => {
    let s = step(setup(), move);
    expect(s.pendingAttackChoices).toHaveLength(1);
    s = step(s, choose);
    if (mode === 'source-gust') {
      s = step(s, {
        type: 'cast-spell',
        playerId: 'a',
        cardId: 'spell',
        targetId: 'ally',
        payment: noRunes,
      });
      s = resolveTop(s);
    } else
      s = {
        ...s,
        units: s.units.map((u) =>
          u.id === 'enemy' ? { ...u, zoneId: 'base-b' } : u,
        ),
      };
    s = resolveTop(s);
    expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(0);
  },
);
it('Deflect est payé au choix, et sans Power aucune cible ne peut être choisie', () => {
  let s = setup();
  s.units[1]!.definitionId = poutyPoro.id;
  s.resources.a!.power = {};
  s = step(s, move);
  expect(s.pendingAttackChoices).toHaveLength(1);
  expect(act(s, choose).ok).toBe(false);
  expect(getLegalActions(s, 'a')).toContainEqual({
    ...choose,
    effects: [{ sourceId: 'ally', payment: noRunes }],
  });
  s.resources.a!.power.vert = 1;
  s = step(s, choose);
  expect(s.resources.a!.power.vert).toBe(0);
  s = resolveTop(s);
  expect(s.units[1]!.damage).toBe(1);
});
it.each(['open', 'defending'])('aucune capacité en %s', (mode) => {
  let s = setup();
  if (mode === 'open') s.units[1]!.zoneId = 'base-b';
  else {
    s.activePlayerId = 'b';
    s.units[0]!.zoneId = 'g';
    s.units[1]!.zoneId = 'base-b';
    s.units[1]!.ready = true;
  }
  s = step(
    s,
    mode === 'open' ? move : { ...move, playerId: 'b', unitId: 'enemy' },
  );
  expect(s.pendingAttackChoices).toBeUndefined();
  expect(s.stack).toBeUndefined();
});
