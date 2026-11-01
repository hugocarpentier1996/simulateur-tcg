import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { teemoChaos, stupefy } from '../../game-data/src/index.js';
import { effectiveMight } from './effects/modifiers.js';

it('Teemo (Chaos) : à la mise en jeu, +3 Might jusqu’à la fin du tour', () => {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [teemoChaos];
  s.cards.push({
    id: 'teemo',
    definitionId: teemoChaos.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 2, power: {} };
  const after = resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'teemo',
      payment: noRunes,
    }),
  );
  const teemo = after.units.find((u) => u.id === 'teemo')!;
  expect(effectiveMight(teemo, after)).toBe(4);
  expect(teemoChaos.hidden).toBe(true);
});
