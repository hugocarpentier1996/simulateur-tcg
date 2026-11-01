import { expect, it } from 'vitest';
import { spellScenario, step } from './origins-test-fixtures.js';
import { adaptatron, sealOfRage, stupefy } from '../../game-data/src/index.js';
import { resolveModeChoice } from './effects/mode-choice.js';
import { unitConquerEntries } from './effects/unit-conquer.js';

function scenario(withGear: boolean) {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [adaptatron];
  s.gearDefinitions = [sealOfRage];
  s.units[0] = { ...s.units[0]!, definitionId: adaptatron.id };
  s.gears = withGear
    ? [
        {
          id: 'seal',
          definitionId: sealOfRage.id,
          ownerId: 'b',
          zoneId: 'base-b',
          ready: true,
        },
      ]
    : [];
  s.stack = {
    entries: [],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  return s;
}

it('Adaptatron : à la conquête, peut détruire un gear et se buffer', () => {
  const s = scenario(true);
  const [entry] = unitConquerEntries(s, 'a', 'f');
  expect(entry).toMatchObject({ kind: 'mode-choice', killGearBuff: true });
  const pending = resolveModeChoice(s, entry as never).state;
  expect(pending.pendingModeChoice?.modes).toEqual(['skip', 'kill-gear:seal']);
  const after = step(pending, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'kill-gear:seal',
  });
  expect(after.gears).toEqual([]);
  expect(after.units.find((u) => u.id === 'ally')?.buffed).toBe(true);
  const skipped = step(pending, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'skip',
  });
  expect(skipped.gears).toHaveLength(1);
  expect(skipped.units.find((u) => u.id === 'ally')?.buffed).toBeUndefined();
});

it('Adaptatron : sans gear en jeu, la capacité est sans effet', () => {
  const s = scenario(false);
  const [entry] = unitConquerEntries(s, 'a', 'f');
  expect(
    resolveModeChoice(s, entry as never).state.pendingModeChoice ?? null,
  ).toBeNull();
});
