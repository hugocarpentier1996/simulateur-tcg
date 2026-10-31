import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import {
  jinxChaos,
  chemtechEnforcer,
  mobilize,
} from '../../game-data/src/index.js';

it('Jinx (Chaos) : quand son propriétaire défausse, se redresse et gagne +1 Might ce tour', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [jinxChaos, chemtechEnforcer];
  s.cards[0]!.definitionId = chemtechEnforcer.id;
  s.units[0] = {
    ...s.units[0]!,
    definitionId: jinxChaos.id,
    might: 5,
    ready: false,
  };
  s.cards.push({ id: 'h0', definitionId: 'x', ownerId: 'a', zoneId: 'hand-a' });
  s.resources.a = { energy: 2, power: {} };
  s = resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      payment: noRunes,
    }),
  );
  expect(s.units[0]?.ready).toBe(false);
  s = step(s, { type: 'choose-discard', playerId: 'a', cardId: 'h0' });
  expect(s.units[0]?.ready).toBe(true);
  expect(effectiveMight(s.units[0]!, s)).toBe(6);
});
