import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
  drain,
} from './origins-test-fixtures.js';
import { vanguardHelm, hextechRay } from '../../game-data/src/index.js';

it('Vanguard Helm : quand une alliée buffée meurt, une autre alliée est buffée', () => {
  const s = spellScenario(hextechRay);
  s.gearDefinitions = [vanguardHelm];
  s.gears = [
    {
      id: 'helm',
      definitionId: vanguardHelm.id,
      ownerId: 'b',
      zoneId: 'base-b',
      ready: true,
    },
  ];
  s.units[1] = { ...s.units[1]!, might: 2, buffed: true };
  s.units.push({
    ...s.units[1]!,
    id: 'enemy2',
    buffed: false,
    zoneId: 'base-b',
  });
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  const after = drain(
    resolveTop(
      step(s, {
        type: 'cast-spell',
        playerId: 'a',
        cardId: 'spell',
        targetId: 'enemy',
        payment: noRunes,
      }),
    ),
  );
  expect(after.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(after.units.find((u) => u.id === 'enemy2')?.buffed).toBe(true);
});
