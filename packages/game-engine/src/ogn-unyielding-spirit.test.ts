import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { unyieldingSpirit, hextechRay } from '../../game-data/src/index.js';

it('Unyielding Spirit : empêche tous les dégâts de sort et de capacité ce tour', () => {
  let s = spellScenario(unyieldingSpirit);
  s.spellDefinitions = [unyieldingSpirit, hextechRay];
  s.cards.push({
    id: 'ray',
    definitionId: hextechRay.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 2, power: { orange: 1, rouge: 1 } };
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(s.effectDamagePrevented).toBe(true);
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'ray',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(0);
  s = step(s, { type: 'end-turn', playerId: 'a' });
  expect(s.effectDamagePrevented ?? false).toBe(false);
});
