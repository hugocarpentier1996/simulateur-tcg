import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import { handOfNoxus, hextechRay } from '../../game-data/src/index.js';

it('Hand of Noxus : Tap, Legion — ajoute 1 énergie (sans pile)', () => {
  let s = spellScenario(hextechRay);
  s.legendDefinitions = [handOfNoxus];
  s.zones.push({ id: 'legend-a', kind: 'legend', ownerId: 'a' });
  s.cards.push({
    id: 'hand',
    definitionId: handOfNoxus.id,
    ownerId: 'a',
    zoneId: 'legend-a',
    ready: true,
  });
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  const use = { type: 'activate-gear' as const, playerId: 'a', gearId: 'hand' };
  expect(act(s, use).ok).toBe(false);
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  s = step(s, use);
  expect(s.resources.a?.energy).toBe(1);
  expect(s.stack ?? null).toBeNull();
  expect(s.cards.find((c) => c.id === 'hand')?.ready).toBe(false);
});
