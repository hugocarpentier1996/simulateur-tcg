import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { spiritsRefuge, stupefy } from '../../game-data/src/index.js';
import { hasKeyword } from './effects/modifiers.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.gearDefinitions = [spiritsRefuge];
  s.cards.push({
    id: 'refuge',
    definitionId: spiritsRefuge.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 2, power: { vert: 1 } };
  return s;
}
const play = (targetId?: string) => ({
  type: 'play-gear' as const,
  playerId: 'a',
  cardId: 'refuge',
  ...(targetId ? { targetId } : {}),
  payment: noRunes,
});

it('Spirit’s Refuge : posé, buffe une unité alliée ; les alliées buffées ont Deflect', () => {
  const s = step(scenario(), play('ally'));
  const ally = s.units.find((u) => u.id === 'ally')!;
  expect(ally.buffed).toBe(true);
  expect(hasKeyword(ally, s, 'deflect')).toBe(true);
  expect(
    hasKeyword(
      s.units.find((u) => u.id === 'enemy')!,
      s,
      'deflect',
    ),
  ).toBe(false);
});

it('Spirit’s Refuge : la cible est une unité alliée', () => {
  expect(act(scenario(), play('enemy')).ok).toBe(false);
  expect(act(scenario(), play()).ok).toBe(false);
  expect(
    getLegalActions(scenario(), 'a').filter((a) => a.type === 'play-gear'),
  ).toEqual([play('ally')]);
});
