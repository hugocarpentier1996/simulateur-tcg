import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { enGarde } from '../../game-data/src/index.js';
it.each([false, true])(
  'En Garde vérifie les alliés présents à la résolution : %s',
  (reinforcement) => {
    let s = spellScenario(enGarde);
    s = step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'ally',
      payment: noRunes,
    });
    s = {
      ...s,
      units: [
        ...s.units,
        {
          ...s.units[1]!,
          id: 'visitor',
          zoneId: 'f',
          ownerId: reinforcement ? 'a' : 'b',
        },
      ],
    };
    s = resolveTop(s);
    expect(
      effectiveMight(
        s.units.find((u) => u.id === 'ally')!,
        s,
      ),
    ).toBe(reinforcement ? 4 : 5);
  },
);
