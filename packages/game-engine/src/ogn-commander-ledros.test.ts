import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { commanderLedros, stupefy } from '../../game-data/src/index.js';

function scenario(order: number) {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [commanderLedros];
  s.units.push({ ...s.units[0]!, id: 'ally2', zoneId: 'base-a' });
  s.cards.push({
    id: 'ledros',
    definitionId: commanderLedros.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 6, power: { jaune: order } };
  return s;
}
const play = (costUnitIds?: string[]) => ({
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'ledros',
  ...(costUnitIds ? { costUnitIds } : {}),
  payment: noRunes,
});

it('Commander Ledros : chaque unité alliée tuée en coût retire 1 Power Order', () => {
  expect(act(scenario(2), play()).ok).toBe(false);
  const s = step(scenario(2), play(['ally', 'ally2']));
  expect(s.units.map((u) => u.id)).toEqual(['enemy', 'ledros']);
  expect(s.cards.find((c) => c.id === 'ally')?.zoneId).toBe('graveyard-a');
  expect(step(scenario(4), play()).units.some((u) => u.id === 'ledros')).toBe(
    true,
  );
});

it('Commander Ledros : seules des unités alliées peuvent être tuées en coût', () => {
  expect(act(scenario(4), play(['enemy'])).ok).toBe(false);
  const options = getLegalActions(scenario(3), 'a').flatMap((a) =>
    a.type === 'play-unit' && a.destinationId === 'base-a'
      ? [a.costUnitIds?.join('+') ?? '']
      : [],
  );
  expect(new Set(options)).toEqual(new Set(['ally', 'ally2', 'ally+ally2']));
});
