import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { act } from './index.js';
import { krakenHunter, stupefy } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [krakenHunter];
  s.units = [
    { ...s.units[0]!, buffed: true },
    { ...s.units[0]!, id: 'plain' },
    s.units[1]!,
  ];
  s.cards.push({
    id: 'kraken',
    definitionId: krakenHunter.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 3, power: { orange: 1 } };
  return s;
}
const play = (costUnitIds?: string[]) => ({
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'kraken',
  ...(costUnitIds ? { costUnitIds } : {}),
  payment: noRunes,
});

it('Kraken Hunter : chaque buff dépensé retire 1 Power Body', () => {
  expect(act(scenario(), play()).ok).toBe(false);
  expect(act(scenario(), play(['plain'])).ok).toBe(false);
  const s = step(scenario(), play(['ally']));
  expect(s.units.find((u) => u.id === 'ally')?.buffed).toBeUndefined();
  expect(s.units.some((u) => u.id === 'kraken')).toBe(true);
  expect(krakenHunter).toMatchObject({
    assault: 1,
    accelerate: { power: 'orange' },
  });
});
