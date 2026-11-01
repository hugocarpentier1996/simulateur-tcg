import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { clockworkKeeper, mobilize } from '../../game-data/src/index.js';

function scenario(power: Record<string, number>) {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [clockworkKeeper];
  s.cards[0]!.definitionId = clockworkKeeper.id;
  s.resources.a = { energy: 2, power };
  return s;
}
const play = (optionalCost: boolean) => ({
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'spell',
  ...(optionalCost ? { optionalCost } : {}),
  payment: noRunes,
});

it('Clockwork Keeper : payer 1 Power Calm en plus fait piocher 1', () => {
  const s = resolveTop(step(scenario({ vert: 1 }), play(true)));
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
  expect(s.resources.a?.power.vert).toBe(0);
  const plain = step(scenario({ vert: 1 }), play(false));
  expect(plain.stack ?? null).toBeNull();
});

it('Clockwork Keeper : coût facultatif seulement s’il est payable', () => {
  expect(act(scenario({}), play(true)).ok).toBe(false);
  const variants = (power: Record<string, number>) =>
    getLegalActions(scenario(power), 'a').flatMap((a) =>
      a.type === 'play-unit' ? [!!a.optionalCost] : [],
    );
  expect(new Set(variants({ vert: 1 }))).toEqual(new Set([false, true]));
  expect(new Set(variants({}))).toEqual(new Set([false]));
});
