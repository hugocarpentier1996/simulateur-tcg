import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { kinkouMonk, stupefy } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [kinkouMonk];
  s.units.push(
    { ...s.units[0]!, id: 'ally2', zoneId: 'base-a' },
    { ...s.units[0]!, id: 'ally3', zoneId: 'base-a' },
  );
  s.cards.push({
    id: 'monk',
    definitionId: kinkouMonk.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 4, power: { orange: 1 } };
  return s;
}
const play = (onPlaySelectedIds: string[]) => ({
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'monk',
  onPlaySelectedIds,
  payment: noRunes,
});

it('Kinkou Monk : buffe jusqu’à deux autres unités alliées', () => {
  const s = resolveTop(step(scenario(), play(['ally', 'ally3'])));
  expect(s.units.filter((u) => u.buffed).map((u) => u.id)).toEqual([
    'ally',
    'ally3',
  ]);
});

it('Kinkou Monk : au plus deux unités alliées, autres que lui', () => {
  expect(act(scenario(), play(['ally', 'ally2', 'ally3'])).ok).toBe(false);
  expect(act(scenario(), play(['enemy'])).ok).toBe(false);
  expect(act(scenario(), play(['monk'])).ok).toBe(false);
  const options = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'play-unit' && a.destinationId === 'base-a'
      ? [a.onPlaySelectedIds?.join('+') ?? '']
      : [],
  );
  expect(new Set(options)).toEqual(
    new Set([
      '',
      'ally',
      'ally2',
      'ally3',
      'ally+ally2',
      'ally+ally3',
      'ally2+ally3',
    ]),
  );
});
