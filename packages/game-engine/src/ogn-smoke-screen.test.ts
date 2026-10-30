import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight } from './index.js';
import { smokeScreen } from '../../game-data/src/index.js';

it.each([
  [6, 2],
  [3, 1],
  [1, 1],
])(
  'Smoke Screen : -4 Might jusqu’à la fin du tour, minimum 1 (Might %i -> %i)',
  (might, expected) => {
    let s = spellScenario(smokeScreen);
    s.resources.a = { energy: 2, power: { bleu: 1 } };
    s.units[1]!.might = might;
    s = resolveTop(
      step(s, {
        type: 'cast-spell',
        playerId: 'a',
        cardId: 'spell',
        targetId: 'enemy',
        payment: noRunes,
      }),
    );
    expect(effectiveMight(s.units[1]!, s)).toBe(expected);
    s = step(s, { type: 'end-turn', playerId: 'a' });
    expect(effectiveMight(s.units[1]!, s)).toBe(might);
  },
);
