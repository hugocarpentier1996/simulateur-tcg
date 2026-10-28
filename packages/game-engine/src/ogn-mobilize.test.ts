import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { mobilize } from '../../game-data/src/index.js';
it.each([true, false])(
  'Mobilize channel Tap ou pioche si pile vide : rune=%s',
  (hasRune) => {
    let s = spellScenario(mobilize);
    if (hasRune)
      s.cards.push({
        id: 'r',
        definitionId: 'rune',
        ownerId: 'a',
        zoneId: 'rune-pile-a',
        color: 'orange',
      });
    s = step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    });
    if (hasRune)
      expect(s.cards.find((c) => c.id === 'r')?.zoneId).toBe('rune-pile-a');
    s = resolveTop(s);
    if (hasRune)
      expect(s.cards.find((c) => c.id === 'r')).toMatchObject({
        zoneId: 'runes-a',
        ready: false,
      });
    expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe(
      hasRune ? 'deck-a' : 'hand-a',
    );
  },
);
