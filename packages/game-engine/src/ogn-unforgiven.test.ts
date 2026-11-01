import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { unforgiven, stupefy } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.legendDefinitions = [unforgiven];
  s.zones.push({ id: 'legend-a', kind: 'legend', ownerId: 'a' });
  s.cards.push({
    id: 'yasuo',
    definitionId: unforgiven.id,
    ownerId: 'a',
    zoneId: 'legend-a',
    ready: true,
  });
  s.units.push({ ...s.units[0]!, id: 'home', zoneId: 'base-a' });
  s.resources.a = { energy: 2, power: {} };
  return s;
}
const use = (targetId: string, destinationId?: string) => ({
  type: 'activate-gear' as const,
  playerId: 'a',
  gearId: 'yasuo',
  targetId,
  ...(destinationId ? { destinationId } : {}),
  payment: noRunes,
});

it('Unforgiven : 2 énergie, Tap — une unité alliée d’un champ rentre en base', () => {
  const s = resolveTop(step(scenario(), use('ally')));
  expect(s.units.find((u) => u.id === 'ally')?.zoneId).toBe('base-a');
});

it('Unforgiven : ou une unité de la base part sur un champ', () => {
  const s = resolveTop(step(scenario(), use('home', 'f')));
  expect(s.units.find((u) => u.id === 'home')?.zoneId).toBe('f');
  expect(act(scenario(), use('home')).ok).toBe(false);
  const options = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'activate-gear'
      ? [`${a.targetId}>${a.destinationId ?? 'base'}`]
      : [],
  );
  expect(new Set(options)).toEqual(new Set(['ally>base', 'home>f', 'home>g']));
});
