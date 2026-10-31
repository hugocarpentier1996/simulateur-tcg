import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { defy, hextechRay, windWall } from '../../game-data/src/index.js';
import type { SpellBlueprint } from './spell-types.js';

const pending = (id: string, definition: SpellBlueprint) => ({
  card: { id, definitionId: definition.id, ownerId: 'b', zoneId: 'hand-b' },
  definition,
  casterId: 'b',
  targetId: 'ally',
});

it('Defy : ne contre qu’un sort coûtant au plus 4 énergie et 1 Power', () => {
  const s = spellScenario(defy);
  s.resources.a = { energy: 1, power: { vert: 1 } };
  s.activePlayerId = 'b';
  s.spellDefinitions = [defy, hextechRay, windWall];
  s.stack = {
    entries: [pending('ray', hextechRay), pending('wall', windWall)],
    initiatorId: 'b',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  const targets = getLegalActions(s, 'a').flatMap((a) =>
    a.type === 'cast-spell' ? [a.targetId] : [],
  );
  expect(targets).toEqual(['ray']);
});
