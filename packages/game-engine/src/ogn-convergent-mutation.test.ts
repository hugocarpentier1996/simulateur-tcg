import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { effectiveMight } from './effects/modifiers.js';
import { convergentMutation } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(convergentMutation);
  s.resources.a = { energy: 2, power: { bleu: 1 } };
  s.units[0] = { ...s.units[0]!, might: 2 };
  s.units.push({ ...s.units[0]!, id: 'big', might: 7 });
  return s;
}
const cast = (targetId: string, secondaryTargetId: string) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId,
  secondaryTargetId,
  payment: noRunes,
});

it('Convergent Mutation : la Might de l’allié monte à celle d’un autre allié ce tour', () => {
  const s = resolveTop(step(scenario(), cast('ally', 'big')));
  expect(
    effectiveMight(
      s.units.find((u) => u.id === 'ally')!,
      s,
    ),
  ).toBe(7);
  const down = resolveTop(step(scenario(), cast('big', 'ally')));
  expect(
    effectiveMight(
      down.units.find((u) => u.id === 'big')!,
      down,
    ),
  ).toBe(7);
});

it('Convergent Mutation : deux unités alliées distinctes', () => {
  expect(act(scenario(), cast('ally', 'enemy')).ok).toBe(false);
  expect(act(scenario(), cast('ally', 'ally')).ok).toBe(false);
  const pairs = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'cast-spell' ? [`${a.targetId}>${a.secondaryTargetId}`] : [],
  );
  expect(new Set(pairs)).toEqual(new Set(['ally>big', 'big>ally']));
});
