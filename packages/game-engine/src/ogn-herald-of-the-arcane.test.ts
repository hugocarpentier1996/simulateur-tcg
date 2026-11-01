import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import {
  heraldOfTheArcane,
  recruitToken,
  mobilize,
} from '../../game-data/src/index.js';

it('Herald of the Arcane : 1 énergie + Tap — joue une Recrue 1 dans la base', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [recruitToken];
  s.legendDefinitions = [heraldOfTheArcane];
  s.zones.push({ id: 'legend-a', kind: 'legend', ownerId: 'a' });
  s.cards.push({
    id: 'herald',
    definitionId: heraldOfTheArcane.id,
    ownerId: 'a',
    zoneId: 'legend-a',
    ready: true,
  });
  s.resources.a = { energy: 1, power: {} };
  const actions = getLegalActions(s, 'a').filter(
    (a) => a.type === 'activate-gear',
  );
  expect(actions).toEqual([expect.objectContaining({ gearId: 'herald' })]);
  s = resolveTop(
    step(s, {
      type: 'activate-gear',
      playerId: 'a',
      gearId: 'herald',
      payment: noRunes,
    }),
  );
  expect(
    s.units
      .filter((u) => u.definitionId === recruitToken.id)
      .map((u) => u.zoneId),
  ).toEqual(['base-a']);
});
