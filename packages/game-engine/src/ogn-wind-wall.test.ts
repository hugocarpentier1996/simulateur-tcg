import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { hextechRay, windWall } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(windWall);
  s.resources.a = { energy: 3, power: { vert: 2 } };
  s.activePlayerId = 'b';
  s.spellDefinitions = [windWall, hextechRay];
  s.stack = {
    entries: [
      {
        card: {
          id: 'ray',
          definitionId: hextechRay.id,
          ownerId: 'b',
          zoneId: 'hand-b',
        },
        definition: hextechRay,
        casterId: 'b',
        targetId: 'ally',
      },
    ],
    initiatorId: 'b',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  return s;
}
const counter = (targetId: string) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId,
  payment: noRunes,
});

it('Wind Wall : contre le sort ciblé, qui part au cimetière sans effet', () => {
  const s = resolveTop(step(scenario(), counter('ray')));
  expect(s.stack ?? null).toBeNull();
  expect(s.cards.find((c) => c.id === 'ray')?.zoneId).toBe('graveyard-b');
  expect(s.units.find((u) => u.id === 'ally')?.damage).toBe(0);
});

it('Wind Wall : seule cible possible, un sort sur la pile', () => {
  expect(act(scenario(), counter('ally')).ok).toBe(false);
  const targets = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'cast-spell' ? [a.targetId] : [],
  );
  expect(targets).toEqual(['ray']);
});
