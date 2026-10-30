import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { vengeance } from '../../game-data/src/index.js';

it.each(['g', 'base-b'])(
  'Vengeance : tue une unité quelconque (zone %s), quelle que soit sa Might',
  (zoneId) => {
    let s = spellScenario(vengeance);
    s.resources.a = { energy: 4, power: { jaune: 2 } };
    s.units[1]!.zoneId = zoneId;
    s.units[1]!.might = 12;
    s = resolveTop(
      step(s, {
        type: 'cast-spell',
        playerId: 'a',
        cardId: 'spell',
        targetId: 'enemy',
        payment: noRunes,
      }),
    );
    expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
  },
);
