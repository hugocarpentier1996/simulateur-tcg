import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { avaAchiever, pakaaCub, stupefy } from '../../game-data/src/index.js';

it('Ava Achiever : en attaquant, payer 1 Mind joue ici une carte Hidden de sa main', () => {
  const s0 = spellScenario(stupefy);
  s0.unitDefinitions = [avaAchiever, pakaaCub];
  s0.units[0] = {
    ...s0.units[0]!,
    id: 'ava',
    definitionId: avaAchiever.id,
    zoneId: 'base-a',
    might: 4,
  };
  s0.cards.push({
    id: 'cub',
    definitionId: pakaaCub.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s0.resources.a = { energy: 0, power: { bleu: 1 } };
  let s = step(s0, {
    type: 'move',
    playerId: 'a',
    unitId: 'ava',
    destinationId: 'g',
  });
  while (s.stack && !s.pendingModeChoice) s = resolveTop(s);
  expect(s.pendingModeChoice?.modes).toEqual(['skip', 'ava:cub']);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'ava:cub' });
  expect(s.units.find((u) => u.id === 'cub')?.zoneId).toBe('g');
  expect(s.resources.a?.power.bleu ?? 0).toBe(0);
});
