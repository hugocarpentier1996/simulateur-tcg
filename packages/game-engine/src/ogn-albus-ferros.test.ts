import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { albusFerros, stupefy } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [albusFerros];
  s.units = [
    { ...s.units[0]!, id: 'b1', buffed: true },
    { ...s.units[0]!, id: 'b2', buffed: true },
    { ...s.units[0]!, id: 'plain' },
    s.units[1]!,
  ];
  s.cards.push(
    {
      id: 'albus',
      definitionId: albusFerros.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    },
    ...[0, 1].map((i) => ({
      id: `rune-${i}`,
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'rune-pile-a',
      color: 'jaune',
    })),
  );
  s.resources.a = { energy: 4, power: {} };
  return s;
}
const play = (onPlaySelectedIds?: string[]) => ({
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'albus',
  ...(onPlaySelectedIds ? { onPlaySelectedIds } : {}),
  payment: noRunes,
});

it('Albus Ferros : chaque buff dépensé canalise 1 rune Tap', () => {
  const s = resolveTop(step(scenario(), play(['b1', 'b2'])));
  expect(s.units.filter((u) => u.buffed)).toEqual([]);
  expect(s.cards.filter((c) => c.zoneId === 'runes-a')).toHaveLength(2);
});

it('Albus Ferros : seules des unités alliées buffées peuvent être choisies', () => {
  expect(act(scenario(), play(['plain'])).ok).toBe(false);
  expect(act(scenario(), play(['enemy'])).ok).toBe(false);
  const options = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'play-unit' && a.destinationId === 'base-a'
      ? [a.onPlaySelectedIds?.join('+') ?? '']
      : [],
  );
  expect(new Set(options)).toEqual(new Set(['', 'b1', 'b2', 'b1+b2']));
});
