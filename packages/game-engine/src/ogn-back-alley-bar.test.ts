import { expect, it } from 'vitest';
import { spellScenario, step } from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { backAlleyBar, mobilize } from '../../game-data/src/index.js';

it('Back-Alley Bar : une unité qui quitte ce champ gagne +1 Might ce tour', () => {
  let s = spellScenario(mobilize);
  s.battlefieldDefinitions = [backAlleyBar];
  s.battlefields[0]!.definitionId = backAlleyBar.id;
  const might = s.units[0]!.might;
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'base-a',
  });
  expect(
    effectiveMight(
      s.units.find((u) => u.id === 'ally')!,
      s,
    ),
  ).toBe(might + 1);
});
