import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { timeWarp } from '../../game-data/src/index.js';
import { startNextTurn } from './turn/progression.js';

it('Time Warp : son lanceur joue un tour supplémentaire, puis la carte est bannie', () => {
  const s = spellScenario(timeWarp);
  s.zones.push({ id: 'banished-a', kind: 'banished', ownerId: 'a' });
  s.resources.a = { energy: 10, power: { bleu: 4 } };
  const after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(after.cards.find((c) => c.id === 'spell')?.zoneId).toBe('banished-a');
  const extra = startNextTurn(after).state;
  expect(extra.activePlayerId).toBe('a');
  expect(extra.extraTurns ?? []).toEqual([]);
  expect(startNextTurn(extra).state.activePlayerId).toBe('b');
});
