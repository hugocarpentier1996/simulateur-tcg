import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { ironBallista, mobilize } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(mobilize);
  s.gearDefinitions = [ironBallista];
  s.units.push({ ...s.units[1]!, id: 'home', zoneId: 'base-b' });
  return s;
}

it('Iron Ballista : entre Tap', () => {
  let s = scenario();
  s.cards.push({
    id: 'ballista',
    definitionId: ironBallista.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 3, power: {} };
  s = step(s, {
    type: 'play-gear',
    playerId: 'a',
    cardId: 'ballista',
    payment: noRunes,
  });
  expect(s.gears?.[0]).toMatchObject({ id: 'ballista', ready: false });
});

it('Iron Ballista : Tap — 2 dégâts à une unité sur un champ, via la pile', () => {
  let s = scenario();
  s.gears = [
    {
      id: 'ballista',
      definitionId: ironBallista.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  s.units[1] = { ...s.units[1]!, might: 5 };
  const targets = getLegalActions(s, 'a').flatMap((a) =>
    a.type === 'activate-gear' ? [a.targetId] : [],
  );
  expect(new Set(targets)).toEqual(new Set(['ally', 'enemy']));
  expect(
    act(s, {
      type: 'activate-gear',
      playerId: 'a',
      gearId: 'ballista',
      targetId: 'home',
      payment: noRunes,
    }).ok,
  ).toBe(false);
  s = step(s, {
    type: 'activate-gear',
    playerId: 'a',
    gearId: 'ballista',
    targetId: 'enemy',
    payment: noRunes,
  });
  expect(s.gears?.[0]?.ready).toBe(false);
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(0);
  s = resolveTop(s);
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(2);
  expect(
    act(s, {
      type: 'activate-gear',
      playerId: 'a',
      gearId: 'ballista',
      targetId: 'enemy',
      payment: noRunes,
    }).ok,
  ).toBe(false);
});
