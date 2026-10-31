import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { undercoverAgent, hextechRay } from '../../game-data/src/index.js';

it('Undercover Agent : Deathknell, son propriétaire défausse 2 puis pioche 2', () => {
  let s = spellScenario(hextechRay);
  s.unitDefinitions = [undercoverAgent];
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  s.units[1] = { ...s.units[1]!, definitionId: undercoverAgent.id, might: 1 };
  s.cards.push(
    { id: 'h0', definitionId: 'x', ownerId: 'b', zoneId: 'hand-b' },
    { id: 'h1', definitionId: 'x', ownerId: 'b', zoneId: 'hand-b' },
    { id: 'draw-b-1', definitionId: 'x', ownerId: 'b', zoneId: 'deck-b' },
  );
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  s = step(
    s,
    getLegalActions(s, 'b').find((a) => a.type === 'queue-death-effects')!,
  );
  s = resolveTop(s);
  expect(s.pendingDiscard).toMatchObject({ playerId: 'b', remaining: 2 });
  s = step(s, { type: 'choose-discard', playerId: 'b', cardId: 'h0' });
  s = step(s, { type: 'choose-discard', playerId: 'b', cardId: 'h1' });
  const hand = s.cards.filter((c) => c.zoneId === 'hand-b').map((c) => c.id);
  expect(new Set(hand)).toEqual(new Set(['draw-b-0', 'draw-b-1']));
});
