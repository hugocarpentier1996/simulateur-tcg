import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { eclipseHerald, zenithBlade } from '../../game-data/src/index.js';

it('Eclipse Herald : quand son propriétaire étourdit un ennemi, se redresse et gagne +1 Might', () => {
  let s = spellScenario(zenithBlade);
  s.unitDefinitions = [eclipseHerald];
  s.units.push({
    ...s.units[0]!,
    id: 'herald',
    definitionId: eclipseHerald.id,
    ready: false,
    might: 7,
    zoneId: 'base-a',
  });
  s.resources.a = {
    energy: 5,
    power: { vert: 2, rouge: 2, bleu: 2, orange: 2, violet: 2, jaune: 2 },
  };
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  const herald = s.units.find((u) => u.id === 'herald')!;
  expect(herald.ready).toBe(true);
  expect(effectiveMight(herald, s)).toBe(8);
});
