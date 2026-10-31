import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import { spoilsOfWar, hextechRay } from '../../game-data/src/index.js';

it('Spoils of War : pioche 2 ; coûte 2 de moins si une unité ennemie est morte ce tour', () => {
  let s = spellScenario(hextechRay);
  s.spellDefinitions = [hextechRay, spoilsOfWar];
  s.cards.push({
    id: 'spoils',
    definitionId: spoilsOfWar.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 3, power: { rouge: 1, orange: 1 } };
  s.units[1] = { ...s.units[1]!, might: 1 };
  const spoils = {
    type: 'cast-spell' as const,
    playerId: 'a',
    cardId: 'spoils',
    targetId: 'a',
    payment: noRunes,
  };
  expect(act(s, spoils).ok).toBe(false);
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(s.enemyDeathsThisTurn).toEqual(['a']);
  s = resolveTop(step(s, spoils));
  expect(s.cards.filter((c) => c.zoneId === 'hand-a')).toHaveLength(2);
});
