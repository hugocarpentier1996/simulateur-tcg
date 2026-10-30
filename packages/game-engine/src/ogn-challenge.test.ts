import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './act.js';
import { challenge } from '../../game-data/src/index.js';

const cast = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'ally',
  secondaryTargetId: 'enemy',
  payment: noRunes,
};

it('Challenge : une unité alliée et une ennemie s’infligent leur Might, sans bonus', () => {
  let s = spellScenario(challenge);
  s.resources.a = { energy: 2, power: { orange: 1 } };
  s.units[0]!.might = 5;
  s.units[1]!.might = 2;
  s.units[1]!.zoneId = 'base-b';
  s = resolveTop(step(s, cast));
  expect(s.units.find((u) => u.id === 'ally')).toMatchObject({ damage: 2 });
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
});

it('Challenge exige une unité alliée puis une unité ennemie', () => {
  const s = spellScenario(challenge);
  s.resources.a = { energy: 2, power: { orange: 1 } };
  expect(
    act(s, { ...cast, targetId: 'enemy', secondaryTargetId: 'ally' }).ok,
  ).toBe(false);
  const { secondaryTargetId: _enemy, ...withoutEnemy } = cast;
  expect(_enemy).toBe('enemy');
  expect(act(s, withoutEnemy).ok).toBe(false);
});
