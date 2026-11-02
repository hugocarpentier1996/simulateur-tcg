import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
  passUntilChoice,
} from './origins-test-fixtures.js';
import { mistfall, showstopper } from '../../game-data/src/index.js';

function cast(body: number) {
  const s = spellScenario(showstopper);
  s.gearDefinitions = [mistfall];
  s.gears = [
    {
      id: 'mist',
      definitionId: mistfall.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  s.units[0] = { ...s.units[0]!, zoneId: 'base-a', ready: false };
  s.resources.a = { energy: 1, power: { orange: body + 1 } };
  return passUntilChoice(
    resolveTop(
      step(s, {
        type: 'cast-spell',
        playerId: 'a',
        cardId: 'spell',
        targetId: 'ally',
        destinationId: 'f',
        payment: noRunes,
      }),
    ),
  );
}

it('Mistfall : une alliée buffée Tap est redressée en payant 1 Power Body et en couchant le gear', () => {
  let s = cast(1);
  expect(s.pendingModeChoice?.modes).toEqual(['skip', 'accept']);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'accept' });
  expect(s.units.find((u) => u.id === 'ally')).toMatchObject({
    buffed: true,
    ready: true,
  });
  expect(s.gears?.[0]?.ready).toBe(false);
  expect(s.resources.a?.power.orange ?? 0).toBe(0);
});

it('Mistfall : sans Power Body disponible, rien (et rien à demander)', () => {
  const s = cast(0);
  expect(s.pendingModeChoice ?? null).toBeNull();
  expect(s.units.find((u) => u.id === 'ally')?.ready).toBe(false);
  expect(s.gears?.[0]?.ready).toBe(true);
});
