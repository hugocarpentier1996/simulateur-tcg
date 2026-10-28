import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { stupefy, testSpells } from '../../game-data/src/index.js';
import { effectiveMight } from './effects/modifiers.js';
import type { GameState } from './types.js';
import { duneDrake } from '../../game-data/src/index.js';
function setup(): GameState {
  const s = spellScenario(stupefy);
  return {
    ...s,
    unitDefinitions: [
      duneDrake,
      {
        id: 'apprentice',
        type: 'unit',
        might: 3,
        cost: { energy: 0, power: {} },
        spellEnergyAbility: 1,
      },
    ],
    units: s.units.map((u) =>
      u.id === 'ally'
        ? { ...u, definitionId: duneDrake.id, zoneId: 'base-a', might: 5 }
        : { ...u, definitionId: 'apprentice' },
    ),
  };
}
const move = {
  type: 'move' as const,
  playerId: 'a',
  unitId: 'ally',
  destinationId: 'g',
};
it('Dune Drake gagne +2 après sa fenêtre, avant les dégâts et sans retrigger aux passes', () => {
  let s = step(setup(), move);
  expect(s.stack?.entries).toHaveLength(1);
  expect(effectiveMight(s.units[0]!, s)).toBe(5);
  s = resolveTop(s);
  expect(effectiveMight(s.units[0]!, s)).toBe(7);
  expect(s.stack).toBeNull();
  expect(s.showdown).toMatchObject({ kind: 'combat', stage: 'priority' });
  s = step(s, { type: 'pass', playerId: s.showdown!.priorityPlayerId });
  s = step(s, { type: 'pass', playerId: s.showdown!.priorityPlayerId });
  expect(s.showdown).toMatchObject({ stage: 'damage' });
  expect(s.stack).toBeNull();
});
it('un défenseur qui se Tap avec ADD avant résolution empêche le bonus', () => {
  let s = step(setup(), move);
  expect(s.stack?.entries).toHaveLength(1);
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, {
    type: 'activate-spell-energy',
    playerId: 'b',
    unitId: 'enemy',
  });
  s = step(s, { type: 'pass', playerId: 'b' });
  expect(effectiveMight(s.units[0]!, s)).toBe(5);
  expect(s.stack).toBeNull();
});
it.each(['tapped', 'open', 'defending'] as const)(
  'pas de déclenchement si %s',
  (mode) => {
    let s = setup();
    if (mode === 'tapped') s.units[1]!.ready = false;
    if (mode === 'open') s.units[1]!.zoneId = 'base-b';
    if (mode === 'defending') {
      s.activePlayerId = 'b';
      s.units[0]!.zoneId = 'g';
      s.units[1]!.zoneId = 'base-b';
      s = step(s, { ...move, playerId: 'b', unitId: 'enemy' });
    } else s = step(s, move);
    expect(s.stack).toBeUndefined();
    expect(
      effectiveMight(
        s.units.find((u) => u.id === 'ally')!,
        s,
      ),
    ).toBe(5);
  },
);
it('la conversion Open vers Combat déclenche Dune après la chaîne du déplacement adverse', () => {
  let s = setup();
  const reposition = testSpells[0]!;
  s.spellDefinitions = [reposition];
  s.cards[0]!.definitionId = reposition.id;
  s.resources.a!.power = { 'color-1': 1 };
  s.units[1]!.zoneId = 'base-b';
  s = step(s, move);
  expect(s.showdown?.kind).toBe('open');
  expect(s.stack).toBeUndefined();
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    destinationId: 'g',
    payment: noRunes,
  });
  s = resolveTop(s);
  expect(s.showdown?.kind).toBe('combat');
  expect(s.stack?.entries).toHaveLength(1);
  s = resolveTop(s);
  expect(effectiveMight(s.units[0]!, s)).toBe(7);
});
it('un nouveau combat après remplacement du défenseur redéclenche Dune sans score intermédiaire', () => {
  let s = step(setup(), move);
  expect(s.stack?.entries).toHaveLength(1);
  s = resolveTop(s);
  // Le défenseur a été remplacé par une unité Ready et une dernière réaction attend sa résolution.
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
    stack: {
      entries: [
        {
          card: {
            id: 'last',
            definitionId: stupefy.id,
            ownerId: 'a',
            zoneId: 'hand-a',
          },
          definition: stupefy,
          casterId: 'a',
          targetId: 'enemy',
        },
      ],
      initiatorId: 'a',
      priorityPlayerId: 'a',
      consecutivePasses: 0,
    },
  };
  s = resolveTop(s);
  expect(s.players[0]!.score).toBe(0);
  expect(s.stack?.entries).toHaveLength(1);
  expect(s.showdown).toMatchObject({ stage: 'priority' });
  s = resolveTop(s);
  expect(effectiveMight(s.units[0]!, s)).toBe(9);
});
