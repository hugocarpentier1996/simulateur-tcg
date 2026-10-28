import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { mobilize } from '../../game-data/src/index.js';
import { stormclawUrsine } from '../../game-data/src/index.js';
it.each([false, true])(
  'Stormclaw entre Tank puis channel Tap, sans pioche si pile vide : %s',
  (hasRune) => {
    let s = spellScenario(mobilize);
    s.unitDefinitions = [stormclawUrsine];
    s.cards[0]!.definitionId = stormclawUrsine.id;
    if (hasRune)
      s.cards.push({
        id: 'r',
        definitionId: 'rune',
        ownerId: 'a',
        zoneId: 'rune-pile-a',
        color: 'orange',
      });
    s = step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      payment: noRunes,
    });
    expect(s.units.find((u) => u.id === 'spell')).toMatchObject({
      tank: true,
      ready: false,
      might: 6,
    });
    expect(s.stack?.entries).toHaveLength(1);
    s = resolveTop(s);
    if (hasRune)
      expect(s.cards.find((c) => c.id === 'r')).toMatchObject({
        zoneId: 'runes-a',
        ready: false,
      });
    expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('deck-a');
  },
);
