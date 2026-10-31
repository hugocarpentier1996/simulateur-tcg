import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { act } from './index.js';
import {
  heraldOfScales,
  mountainDrake,
  mobilize,
} from '../../game-data/src/index.js';

it('Herald of Scales : les Dragons de son propriétaire coûtent 2 énergie de moins (minimum 1)', () => {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [heraldOfScales, mountainDrake];
  s.cards[0]!.definitionId = mountainDrake.id;
  s.units.push({
    ...s.units[0]!,
    id: 'herald',
    definitionId: heraldOfScales.id,
    zoneId: 'base-a',
  });
  expect(mountainDrake.tags).toContain('Dragon');
  const cost = mountainDrake.cost;
  s.resources.a = { energy: cost.energy - 3, power: { ...cost.power } };
  const play = {
    type: 'play-unit' as const,
    playerId: 'a',
    cardId: 'spell',
    payment: noRunes,
  };
  expect(act(s, play).ok).toBe(false);
  s.resources.a = { energy: cost.energy - 2, power: { ...cost.power } };
  expect(step(s, play).resources.a?.energy).toBe(0);
});
