import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { acceptableLosses, sealOfRage } from '../../game-data/src/index.js';

it('Acceptable Losses : chaque joueur détruit un de ses gears', () => {
  const s = spellScenario(acceptableLosses);
  s.resources.a = { energy: 1, power: {} };
  s.gearDefinitions = [sealOfRage];
  s.gears = ['a', 'b'].map((p) => ({
    id: `seal-${p}`,
    definitionId: sealOfRage.id,
    ownerId: p,
    zoneId: `base-${p}`,
    ready: true,
  }));
  let after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  after = step(after, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'kill-own:seal-a',
  });
  after = step(after, {
    type: 'choose-mode',
    playerId: 'b',
    mode: 'kill-own:seal-b',
  });
  expect(after.gears).toEqual([]);
  expect(after.cards.find((c) => c.id === 'seal-b')?.zoneId).toBe(
    'graveyard-b',
  );
});
