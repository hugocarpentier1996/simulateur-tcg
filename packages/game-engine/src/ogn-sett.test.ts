import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { sett, stupefy } from '../../game-data/src/index.js';
import { effectiveMight } from './effects/modifiers.js';
import { unitConquerEntries } from './effects/unit-conquer.js';

function played() {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [sett];
  s.cards.push({
    id: 'sett',
    definitionId: sett.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 5, power: { orange: 1 } };
  return resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'sett',
      payment: noRunes,
    }),
  );
}
const spend = {
  type: 'spend-buff-ability' as const,
  playerId: 'a',
  unitId: 'sett',
};

it('Sett : se buffe quand il est joué', () => {
  expect(played().units.find((u) => u.id === 'sett')?.buffed).toBe(true);
});

it('Sett : dépenser son buff lui donne +4 Might ce tour', () => {
  const s = played();
  expect(getLegalActions(s, 'a')).toContainEqual(spend);
  const after = resolveTop(step(s, spend));
  const unit = after.units.find((u) => u.id === 'sett')!;
  expect(unit.buffed).toBeUndefined();
  expect(effectiveMight(unit, after)).toBe(8);
  expect(act(after, spend).ok).toBe(false);
});

it('Sett : se buffe aussi quand il conquiert', () => {
  const s = played();
  const moved = {
    ...s,
    units: s.units.map((u) => (u.id === 'sett' ? { ...u, zoneId: 'g' } : u)),
  };
  expect(unitConquerEntries(moved, 'a', 'g')).toEqual([
    {
      kind: 'play-effect',
      sourceId: 'sett',
      ownerId: 'a',
      effect: { type: 'buff-units', unitIds: ['sett'] },
    },
  ]);
});
