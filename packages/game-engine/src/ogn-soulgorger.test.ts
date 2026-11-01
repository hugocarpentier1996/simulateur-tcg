import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import { soulgorger, kinkouMonk, stupefy } from '../../game-data/src/index.js';

function scenario(orange: number) {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [soulgorger, kinkouMonk];
  s.cards.push(
    {
      id: 'gorger',
      definitionId: soulgorger.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    },
    {
      id: 'monk',
      definitionId: kinkouMonk.id,
      ownerId: 'a',
      zoneId: 'graveyard-a',
    },
  );
  s.resources.a = { energy: 8, power: { violet: 2, orange } };
  return s;
}
const play = {
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'gorger',
  returnSpellId: 'monk',
  payment: noRunes,
};

it('Soulgorger : joue une unité de son cimetière en payant seulement son Power', () => {
  expect(act(scenario(0), play).ok).toBe(false);
  const s = resolveTop(step(scenario(1), play));
  expect(s.units.find((u) => u.id === 'monk')?.zoneId).toBe('base-a');
  expect(s.resources.a?.power.orange ?? 0).toBe(0);
});
