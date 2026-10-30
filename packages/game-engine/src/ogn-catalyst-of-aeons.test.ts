import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { catalystOfAeons } from '../../game-data/src/index.js';

it.each([
  [3, 2, false],
  [2, 2, false],
  [1, 1, true],
  [0, 0, true],
])(
  'Catalyst of Aeons : %i rune(s) en pile -> %i canalisée(s) Tap, pioche : %s',
  (pile, channeled, draws) => {
    let s = spellScenario(catalystOfAeons);
    s.resources.a = { energy: 4, power: {} };
    for (let i = 0; i < pile; i++)
      s.cards.push({
        id: `rune-${i}`,
        definitionId: 'rune',
        ownerId: 'a',
        zoneId: 'rune-pile-a',
        color: 'orange',
      });
    s = resolveTop(
      step(s, {
        type: 'cast-spell',
        playerId: 'a',
        cardId: 'spell',
        targetId: 'a',
        payment: noRunes,
      }),
    );
    const runes = s.cards.filter((c) => c.zoneId === 'runes-a');
    expect(runes).toHaveLength(channeled);
    expect(runes.every((r) => r.ready === false)).toBe(true);
    expect(s.cards.find((c) => c.id === 'draw-a-0')!.zoneId).toBe(
      draws ? 'hand-a' : 'deck-a',
    );
  },
);
