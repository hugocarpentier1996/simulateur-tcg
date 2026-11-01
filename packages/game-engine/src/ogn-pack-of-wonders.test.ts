import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import {
  packOfWonders,
  sealOfRage,
  pakaaCub,
  stupefy,
} from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.gearDefinitions = [packOfWonders, sealOfRage];
  s.unitDefinitions = [pakaaCub];
  s.gears = [
    {
      id: 'pack',
      definitionId: packOfWonders.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
    {
      id: 'seal',
      definitionId: sealOfRage.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  s.cards.push({
    id: 'cub',
    definitionId: pakaaCub.id,
    ownerId: 'a',
    zoneId: 'f',
    facedown: { fresh: false },
  });
  return s;
}
const use = (targetId: string) => ({
  type: 'activate-gear' as const,
  playerId: 'a',
  gearId: 'pack',
  targetId,
  payment: noRunes,
});

it('Pack of Wonders : renvoie en main une autre unité, un gear ou une carte cachée alliés', () => {
  const targets = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'activate-gear' && a.gearId === 'pack' ? [a.targetId] : [],
  );
  expect(new Set(targets)).toEqual(new Set(['ally', 'seal', 'cub']));
  const unit = resolveTop(step(scenario(), use('ally')));
  expect(unit.cards.find((c) => c.id === 'ally')?.zoneId).toBe('hand-a');
  const gear = resolveTop(step(scenario(), use('seal')));
  expect(gear.gears?.map((g) => g.id)).toEqual(['pack']);
  expect(gear.cards.find((c) => c.id === 'seal')?.zoneId).toBe('hand-a');
  const hidden = resolveTop(step(scenario(), use('cub')));
  expect(hidden.cards.find((c) => c.id === 'cub')).toEqual({
    id: 'cub',
    definitionId: pakaaCub.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
});
