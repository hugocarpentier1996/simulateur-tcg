import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { theBoss, hextechRay } from '../../game-data/src/index.js';
import { queueConquestLegends } from './effects/conquest-legends.js';

function scenario(power: number) {
  const s = spellScenario(hextechRay);
  s.legendDefinitions = [theBoss];
  s.zones.push({ id: 'legend-b', kind: 'legend', ownerId: 'b' });
  s.cards.push({
    id: 'boss',
    definitionId: theBoss.id,
    ownerId: 'b',
    zoneId: 'legend-b',
    ready: true,
  });
  s.units[1] = { ...s.units[1]!, might: 2, buffed: true };
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  s.resources.b = { energy: 0, power: power ? { orange: power } : {} };
  return resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
}

it('The Boss : une unité buffée qui devrait mourir dépense son buff et est rappelée Tap', () => {
  const s = scenario(1);
  const enemy = s.units.find((u) => u.id === 'enemy');
  expect(enemy).toMatchObject({ zoneId: 'base-b', ready: false, damage: 0 });
  expect(enemy?.buffed).toBeUndefined();
  expect(s.cards.find((c) => c.id === 'boss')?.ready).toBe(false);
  expect(s.resources.b?.power.orange ?? 0).toBe(0);
});

it('The Boss : sans Power pour payer, l’unité meurt', () => {
  expect(scenario(0).units.some((u) => u.id === 'enemy')).toBe(false);
});

it('The Boss : quand son propriétaire conquiert, la légende se redresse', () => {
  const s = queueConquestLegends(
    {
      ...scenario(1),
      cards: scenario(1).cards,
    },
    [{ type: 'battlefield-conquered', playerId: 'b', battlefieldId: 'f' }],
  ).state;
  expect(s.cards.find((c) => c.id === 'boss')?.ready).toBe(true);
});
