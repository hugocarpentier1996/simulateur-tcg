import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import {
  poroHerder,
  stalwartPoro,
  mobilize,
} from '../../game-data/src/index.js';

function scenario(withPoro: boolean) {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [poroHerder, stalwartPoro];
  s.cards[0]!.definitionId = poroHerder.id;
  s.resources.a = { energy: 3, power: { vert: 1 } };
  if (withPoro) s.units[0] = { ...s.units[0]!, definitionId: stalwartPoro.id };
  return resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      payment: noRunes,
    }),
  );
}

it('Poro Herder : avec un Poro allié, se buffe et pioche 1', () => {
  const s = scenario(true);
  expect(s.units.find((u) => u.id === 'spell')?.buffed).toBe(true);
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
});

it('Poro Herder : sans Poro, rien', () => {
  const s = scenario(false);
  expect(s.units.find((u) => u.id === 'spell')?.buffed).toBeUndefined();
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('deck-a');
});
