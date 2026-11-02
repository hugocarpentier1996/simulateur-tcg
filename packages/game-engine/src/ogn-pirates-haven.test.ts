import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
  drain,
} from './origins-test-fixtures.js';
import { piratesHaven, rideTheWind } from '../../game-data/src/index.js';
import { effectiveMight } from './effects/modifiers.js';

it('Pirate’s Haven : une unité alliée redressée par un effet gagne +1 Might ce tour', () => {
  const s = spellScenario(rideTheWind);
  s.gearDefinitions = [piratesHaven];
  s.gears = [
    {
      id: 'haven',
      definitionId: piratesHaven.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  s.units[0] = { ...s.units[0]!, ready: false, might: 3 };
  s.resources.a = {
    energy: 10,
    power: { vert: 3, orange: 3, rouge: 3, bleu: 3, violet: 3, jaune: 3 },
  };
  const after = drain(
    resolveTop(
      step(s, {
        type: 'cast-spell',
        playerId: 'a',
        cardId: 'spell',
        targetId: 'ally',
        destinationId: 'g',
        payment: noRunes,
      }),
    ),
  );
  const ally = after.units.find((u) => u.id === 'ally')!;
  expect(ally.ready).toBe(true);
  expect(effectiveMight(ally, after)).toBe(4);
});
