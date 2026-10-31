import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { imperialDecree, hextechRay } from '../../game-data/src/index.js';

it('Imperial Decree : toute unité qui subit des dégâts ce tour est tuée', () => {
  let s = spellScenario(imperialDecree);
  s.spellDefinitions = [imperialDecree, hextechRay];
  s.cards.push({
    id: 'ray',
    definitionId: hextechRay.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 6, power: { jaune: 2, rouge: 1 } };
  s.units = s.units.map((u) => ({ ...u, might: 10 }));
  s.units[0] = { ...s.units[0]!, damage: 2 };
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(s.units.some((u) => u.id === 'ally')).toBe(true);
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'ray',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
  s = step(s, { type: 'end-turn', playerId: 'a' });
  expect(s.damageBaseline ?? null).toBeNull();
});
