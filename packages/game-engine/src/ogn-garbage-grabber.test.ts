import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import { garbageGrabber, stupefy } from '../../game-data/src/index.js';

function scenario(trash: number) {
  const s = spellScenario(stupefy);
  s.gearDefinitions = [garbageGrabber];
  s.gears = [
    {
      id: 'grabber',
      definitionId: garbageGrabber.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  for (let i = 0; i < trash; i++)
    s.cards.push({
      id: `t${i}`,
      definitionId: 'filler',
      ownerId: 'a',
      zoneId: 'graveyard-a',
    });
  s.resources.a = { energy: 1, power: {} };
  return s;
}
const use = {
  type: 'activate-gear' as const,
  playerId: 'a',
  gearId: 'grabber',
  payment: noRunes,
};

it('Garbage Grabber : recycler 3 cartes du cimetière + 1 énergie + Tap : pioche 1', () => {
  expect(act(scenario(2), use).ok).toBe(false);
  let s = step(scenario(4), use);
  expect(s.pendingModeChoice?.modes).toHaveLength(4);
  for (const id of ['t0', 't1', 't2'])
    s = step(s, {
      type: 'choose-mode',
      playerId: 'a',
      mode: `recycle-any:${id}`,
    });
  s = resolveTop(s);
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
  expect(
    s.cards.filter((c) => c.zoneId === 'graveyard-a').map((c) => c.id),
  ).toEqual(['t3']);
  expect(s.gears?.[0]?.ready).toBe(false);
});
