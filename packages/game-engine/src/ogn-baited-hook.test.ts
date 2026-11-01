import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import {
  baitedHook,
  kinkouMonk,
  soulgorger,
  stupefy,
} from '../../game-data/src/index.js';

it('Baited Hook : tue une alliée, puis joue gratuitement une unité du dessus de Might ≤ +1', () => {
  const s0 = spellScenario(stupefy);
  s0.gearDefinitions = [baitedHook];
  s0.unitDefinitions = [kinkouMonk, soulgorger];
  s0.gears = [
    {
      id: 'hook',
      definitionId: baitedHook.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  s0.units[0] = { ...s0.units[0]!, might: 3 };
  s0.cards = s0.cards.filter((c) => c.zoneId !== 'deck-a');
  s0.cards.push(
    { id: 'monk', definitionId: kinkouMonk.id, ownerId: 'a', zoneId: 'deck-a' },
    {
      id: 'gorger',
      definitionId: soulgorger.id,
      ownerId: 'a',
      zoneId: 'deck-a',
    },
    { id: 'x', definitionId: 'filler', ownerId: 'a', zoneId: 'deck-a' },
  );
  s0.resources.a = { energy: 1, power: { jaune: 1 } };
  let s = resolveTop(
    step(s0, {
      type: 'activate-gear',
      playerId: 'a',
      gearId: 'hook',
      targetId: 'ally',
      payment: noRunes,
    }),
  );
  expect(s.units.some((u) => u.id === 'ally')).toBe(false);
  expect(s.pendingModeChoice?.modes).toEqual(['skip', 'reinforce:monk']);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'reinforce:monk' });
  expect(s.units.find((u) => u.id === 'monk')?.zoneId).toBe('base-a');
});
