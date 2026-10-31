import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { salvage, sealOfRage } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(salvage);
  s.resources.a = { energy: 2, power: { jaune: 1 } };
  s.gearDefinitions = [sealOfRage];
  s.gears = [
    {
      id: 'g1',
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
const hand = (s: ReturnType<typeof scenario>) =>
  s.cards.filter((c) => c.zoneId === 'hand-a').length;

it('Salvage : détruit l’équipement choisi puis pioche 1', () => {
  const s = resolveTop(step(scenario(), cast('g1')));
  expect(s.gears).toEqual([]);
  expect(s.cards.find((c) => c.id === 'g1')?.zoneId).toBe('graveyard-b');
  expect(hand(s)).toBe(1);
});

it('Salvage : la destruction est facultative (cible = lanceur)', () => {
  const s = resolveTop(step(scenario(), cast('a')));
  expect(s.gears).toHaveLength(1);
  expect(hand(s)).toBe(1);
  expect(act(scenario(), cast('ally')).ok).toBe(false);
  const targets = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'cast-spell' ? [a.targetId] : [],
  );
  expect(new Set(targets)).toEqual(new Set(['a', 'g1']));
});
