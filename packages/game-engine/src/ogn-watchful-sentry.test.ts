import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { watchfulSentry, hextechRay } from '../../game-data/src/index.js';

it('Watchful Sentry : Deathknell, son propriétaire pioche 1 après la fenêtre de réaction', () => {
  let s = spellScenario(hextechRay);
  s.unitDefinitions = [watchfulSentry];
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  s.units[1] = { ...s.units[1]!, definitionId: watchfulSentry.id, might: 1 };
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(s.pendingDeaths?.playerOrder).toEqual(['b']);
  const choices = getLegalActions(s, 'b').filter(
    (a) => a.type === 'queue-death-effects',
  );
  expect(choices).toHaveLength(1);
  s = step(s, choices[0]!);
  expect(s.cards.find((c) => c.id === 'draw-b-0')!.zoneId).toBe('deck-b');
  s = resolveTop(s);
  expect(s.cards.find((c) => c.id === 'draw-b-0')!.zoneId).toBe('hand-b');
});
