import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { shen, hextechRay } from '../../game-data/src/index.js';
import { isTank } from './combat/allocation.js';

it('Shen : unité Réaction jouable pendant le tour adverse, sur un champ contrôlé', () => {
  let s = spellScenario(hextechRay);
  s.unitDefinitions = [shen];
  s.activePlayerId = 'b';
  s.priorityPlayerId = 'b';
  s.cards.push(
    { id: 'shen', definitionId: shen.id, ownerId: 'a', zoneId: 'hand-a' },
    { id: 'ray', definitionId: hextechRay.id, ownerId: 'b', zoneId: 'hand-b' },
  );
  s.resources.b = { energy: 1, power: { rouge: 1 } };
  s.resources.a = { energy: 3, power: { jaune: 1 } };
  s = step(s, {
    type: 'cast-spell',
    playerId: 'b',
    cardId: 'ray',
    targetId: 'ally',
    payment: noRunes,
  });
  s = step(s, { type: 'pass', playerId: 'b' });
  const after = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'shen',
    destinationId: 'f',
    payment: noRunes,
  });
  const unit = after.units.find((u) => u.id === 'shen')!;
  expect(unit.zoneId).toBe('f');
  expect(isTank(unit)).toBe(true);
  expect(after.stack?.entries).toHaveLength(1);
  expect(shen.shield).toBe(2);
});
