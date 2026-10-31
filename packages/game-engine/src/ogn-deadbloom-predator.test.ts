import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { act } from './index.js';
import { deadbloomPredator, mobilize } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [deadbloomPredator];
  s.cards[0]!.definitionId = deadbloomPredator.id;
  s.resources.a = { energy: 8, power: { orange: 2 } };
  return s;
}
const play = (destinationId: string) => ({
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'spell',
  destinationId,
  payment: noRunes,
});

it('Deadbloom Predator : peut être joué sur un champ occupé par l’ennemi, ce qui lance un combat', () => {
  const s = step(scenario(), play('g'));
  expect(s.units.find((u) => u.id === 'spell')).toMatchObject({
    zoneId: 'g',
    ready: false,
  });
  expect(s.showdown).toMatchObject({ kind: 'combat', battlefieldId: 'g' });
});

it('Deadbloom Predator : pas sur un champ vide non contrôlé', () => {
  const s = scenario();
  s.units = s.units.filter((u) => u.zoneId !== 'g');
  s.battlefields[1]!.controllerId = null;
  expect(act(s, play('g')).ok).toBe(false);
});
