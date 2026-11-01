import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { act } from './index.js';
import { bandleTree, pakaaCub, hextechRay } from '../../game-data/src/index.js';

it('Bandle Tree : on peut y cacher une carte supplémentaire', () => {
  let s = spellScenario(hextechRay);
  s.unitDefinitions = [pakaaCub];
  s.battlefieldDefinitions = [bandleTree];
  s.battlefields[0]!.definitionId = bandleTree.id;
  s.cards.push(
    ...['c1', 'c2', 'c3'].map((id) => ({
      id,
      definitionId: pakaaCub.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    })),
  );
  s.resources.a = { energy: 0, power: { orange: 3 } };
  const hide = (cardId: string) => ({
    type: 'hide-card' as const,
    playerId: 'a',
    cardId,
    battlefieldId: 'f',
    payment: noRunes,
  });
  s = step(step(s, hide('c1')), hide('c2'));
  expect(s.cards.filter((c) => c.facedown && c.zoneId === 'f')).toHaveLength(2);
  expect(act(s, hide('c3')).ok).toBe(false);
});
