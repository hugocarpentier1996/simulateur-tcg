import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { kadregrinTheInfernal, mobilize } from '../../game-data/src/index.js';

it('Kadregrin : pioche 1 par unité alliée Mighty (lui compris) à la résolution', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [kadregrinTheInfernal];
  s.cards[0]!.definitionId = kadregrinTheInfernal.id;
  s.resources.a = { energy: 9, power: { rouge: 2 } };
  s.units[0] = { ...s.units[0]!, might: 5 };
  s.units.push({ ...s.units[0]!, id: 'small', might: 4 });
  s = resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      payment: noRunes,
    }),
  );
  expect(s.cards.filter((c) => c.zoneId === 'hand-a')).toHaveLength(2);
});
