import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { peakGuardian, mobilize } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [peakGuardian];
  s.cards[0]!.definitionId = peakGuardian.id;
  s.resources.a = { energy: 6, power: { jaune: 1 } };
  s.units.push({ ...s.units[0]!, id: 'home', zoneId: 'base-a' });
  return s;
}

it('Peak Guardian : sur un champ, se buffe puis buffe les autres alliés de ce champ', () => {
  const s = resolveTop(
    step(scenario(), {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      destinationId: 'f',
      payment: noRunes,
    }),
  );
  const buffed = (id: string) => !!s.units.find((u) => u.id === id)?.buffed;
  expect([
    buffed('spell'),
    buffed('ally'),
    buffed('home'),
    buffed('enemy'),
  ]).toEqual([true, true, false, false]);
});

it('Peak Guardian : en base, seulement lui-même', () => {
  const s = resolveTop(
    step(scenario(), {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      payment: noRunes,
    }),
  );
  expect(s.units.filter((u) => u.buffed).map((u) => u.id)).toEqual(['spell']);
});
