import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { effectiveMight } from './effects/modifiers.js';
import { buffUnit } from './effects/buff.js';
import { pitRookie, mobilize } from '../../game-data/src/index.js';

it('Buff : +1 Might permanent, jamais cumulé', () => {
  let s = spellScenario(mobilize);
  const might = effectiveMight(s.units[0]!, s);
  s = buffUnit(s, 'ally');
  s = buffUnit(s, 'ally');
  expect(s.units[0]?.buffed).toBe(true);
  expect(effectiveMight(s.units[0]!, s)).toBe(might + 1);
});

it('Pit Rookie : à la mise en jeu, buffe une autre unité alliée', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [pitRookie];
  s.cards[0]!.definitionId = pitRookie.id;
  s.resources.a = { energy: 2, power: {} };
  const targets = getLegalActions(s, 'a').flatMap((a) =>
    a.type === 'play-unit' ? [a.onPlayTargetId] : [],
  );
  expect(new Set(targets)).toEqual(new Set(['ally']));
  s = resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      onPlayTargetId: 'ally',
      payment: noRunes,
    }),
  );
  expect(s.units.find((u) => u.id === 'ally')?.buffed).toBe(true);
});
