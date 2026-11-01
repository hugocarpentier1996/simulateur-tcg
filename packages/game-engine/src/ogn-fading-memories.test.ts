import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import { fadingMemories, sealOfRage } from '../../game-data/src/index.js';
import { startNextTurn } from './turn/progression.js';

function scenario() {
  const s = spellScenario(fadingMemories);
  s.resources.a = { energy: 4, power: { violet: 1 } };
  s.gearDefinitions = [sealOfRage];
  s.gears = [
    {
      id: 'seal',
      definitionId: sealOfRage.id,
      ownerId: 'b',
      zoneId: 'base-b',
      ready: true,
    },
  ];
  return s;
}
const cast = (targetId: string) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId,
  payment: noRunes,
});

it('Fading Memories : une unité d’un champ gagne Temporary et meurt à la Beginning de son contrôleur', () => {
  const s = resolveTop(step(scenario(), cast('enemy')));
  expect(s.units.find((u) => u.id === 'enemy')?.temporary).toBe(true);
  expect(startNextTurn(s).state.units.some((u) => u.id === 'enemy')).toBe(
    false,
  );
});

it('Fading Memories : un gear gagne Temporary et est détruit à la Beginning de son propriétaire', () => {
  const s = resolveTop(step(scenario(), cast('seal')));
  const next = startNextTurn(s).state;
  expect(next.gears ?? []).toEqual([]);
  expect(next.cards.find((c) => c.id === 'seal')?.zoneId).toBe('graveyard-b');
});

it('Fading Memories : pas d’unité en base', () => {
  const s = scenario();
  s.units[1] = { ...s.units[1]!, zoneId: 'base-b' };
  expect(act(s, cast('enemy')).ok).toBe(false);
});
