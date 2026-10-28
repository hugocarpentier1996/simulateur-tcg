import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { act } from './act.js';
import { getLegalActions } from './legal/actions.js';
import { backToBack } from '../../game-data/src/index.js';
const cast = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'a',
  payment: noRunes,
};
function setup() {
  const s = spellScenario(backToBack);
  return {
    ...s,
    units: [...s.units, { ...s.units[0]!, id: 'second', zoneId: 'base-a' }],
  };
}
it('Back to Back exige deux alliés distincts et énumère leur sélection', () => {
  const s = setup();
  for (const selectedUnitIds of [
    [],
    ['ally'],
    ['ally', 'ally'],
    ['ally', 'enemy'],
  ])
    expect(act(s, { ...cast, selectedUnitIds })).toEqual({
      ok: false,
      reason: 'INVALID_TARGET',
    });
  expect(getLegalActions(s, 'a')).toContainEqual({
    ...cast,
    selectedUnitIds: ['ally', 'second'],
  });
});
it.each([false, true])(
  'Back to Back applique séparément les bonus si une cible disparaît : %s',
  (removed) => {
    let s = step(setup(), { ...cast, selectedUnitIds: ['ally', 'second'] });
    if (removed) s = { ...s, units: s.units.filter((u) => u.id !== 'second') };
    s = resolveTop(s);
    expect(
      effectiveMight(
        s.units.find((u) => u.id === 'ally')!,
        s,
      ),
    ).toBe(5);
    if (!removed)
      expect(
        effectiveMight(
          s.units.find((u) => u.id === 'second')!,
          s,
        ),
      ).toBe(5);
    expect(
      effectiveMight(
        s.units.find((u) => u.id === 'enemy')!,
        s,
      ),
    ).toBe(3);
  },
);
