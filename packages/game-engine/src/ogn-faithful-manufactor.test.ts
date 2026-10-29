import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { gust, recruitToken } from '../../game-data/src/index.js';
import { faithfulManufactor } from '../../game-data/src/index.js';
it.each(['base-a', 'f', 'gust'])(
  'Manufactor invoque ici, sauf sortie du terrain : %s',
  (mode) => {
    let s = spellScenario(gust);
    s.unitDefinitions = [faithfulManufactor, recruitToken];
    s.cards.push({
      id: 'unit',
      definitionId: faithfulManufactor.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    });
    s = step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'unit',
      destinationId: mode === 'base-a' ? mode : 'f',
      payment: noRunes,
    });
    expect(s.stack?.entries).toHaveLength(1);
    expect(s.units.some((u) => u.token)).toBe(false);
    if (mode === 'gust') {
      s = step(s, {
        type: 'cast-spell',
        playerId: 'a',
        cardId: 'spell',
        targetId: 'unit',
        payment: noRunes,
      });
      s = resolveTop(s);
    }
    s = resolveTop(s);
    if (mode === 'gust') expect(s.units.some((u) => u.token)).toBe(false);
    else
      expect(s.units.find((u) => u.token)).toMatchObject({
        ownerId: 'a',
        zoneId: mode,
        might: 1,
        ready: false,
      });
  },
);
