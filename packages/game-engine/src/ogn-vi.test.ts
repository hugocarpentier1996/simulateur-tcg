import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { vi as viUnit, stupefy } from '../../game-data/src/index.js';
import { effectiveMight } from './effects/modifiers.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [viUnit];
  s.units[0] = { ...s.units[0]!, definitionId: viUnit.id, might: 3 };
  s.cards.push({
    id: 'old',
    definitionId: 'filler',
    ownerId: 'a',
    zoneId: 'graveyard-a',
  });
  return s;
}
const recycle = (cardId: string) => ({
  type: 'trash-recycle-ability' as const,
  playerId: 'a',
  unitId: 'ally',
  cardId,
});

it('Vi : recycler une carte de son cimetière lui donne +1 Might ce tour', () => {
  expect(getLegalActions(scenario(), 'a')).toContainEqual(recycle('old'));
  const s = resolveTop(step(scenario(), recycle('old')));
  expect(
    effectiveMight(
      s.units.find((u) => u.id === 'ally')!,
      s,
    ),
  ).toBe(4);
  expect(s.cards.at(-1)).toMatchObject({ id: 'old', zoneId: 'deck-a' });
  expect(act(scenario(), recycle('draw-a-0')).ok).toBe(false);
  expect(viUnit.ganking).toBe(true);
});
