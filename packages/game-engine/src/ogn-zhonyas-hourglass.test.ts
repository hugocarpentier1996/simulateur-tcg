import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { zhonyasHourglass, hextechRay } from '../../game-data/src/index.js';
import { startNextTurn } from './turn/progression.js';

function scenario() {
  const s = spellScenario(hextechRay);
  s.gearDefinitions = [zhonyasHourglass];
  s.gears = [
    {
      id: 'zhonya',
      definitionId: zhonyasHourglass.id,
      ownerId: 'b',
      zoneId: 'base-b',
      ready: true,
    },
  ];
  s.units[1] = { ...s.units[1]!, might: 2 };
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  return s;
}

it('Zhonya’s Hourglass : la prochaine alliée qui devrait mourir est rappelée Tap, le gear est détruit', () => {
  const s = resolveTop(
    step(scenario(), {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(s.units.find((u) => u.id === 'enemy')).toMatchObject({
    zoneId: 'base-b',
    ready: false,
    damage: 0,
  });
  expect(s.gears ?? []).toEqual([]);
  expect(s.cards.find((c) => c.id === 'zhonya')?.zoneId).toBe('graveyard-b');
});

it('Zhonya’s Hourglass : caché, il se pose gratuitement au tour suivant', () => {
  let s = spellScenario(hextechRay);
  s.gearDefinitions = [zhonyasHourglass];
  s.cards.push({
    id: 'zhonya',
    definitionId: zhonyasHourglass.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 0, power: { vert: 1 } };
  s = step(s, {
    type: 'hide-card',
    playerId: 'a',
    cardId: 'zhonya',
    battlefieldId: 'f',
    payment: noRunes,
  });
  s = startNextTurn(startNextTurn(s).state).state;
  s.resources.a = { energy: 0, power: {} };
  s = step(s, {
    type: 'play-gear',
    playerId: 'a',
    cardId: 'zhonya',
    payment: noRunes,
  });
  expect(s.gears?.find((g) => g.id === 'zhonya')?.zoneId).toBe('base-a');
});
