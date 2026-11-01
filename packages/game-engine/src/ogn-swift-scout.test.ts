import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import {
  swiftScout,
  teemoChaos,
  pakaaCub,
  stupefy,
} from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.legendDefinitions = [swiftScout];
  s.unitDefinitions = [teemoChaos, pakaaCub];
  s.zones.push(
    { id: 'legend-a', kind: 'legend', ownerId: 'a' },
    { id: 'champion-a', kind: 'champion', ownerId: 'a' },
  );
  s.cards.push(
    {
      id: 'scout',
      definitionId: swiftScout.id,
      ownerId: 'a',
      zoneId: 'legend-a',
      ready: true,
    },
    { id: 'cub', definitionId: pakaaCub.id, ownerId: 'a', zoneId: 'hand-a' },
    {
      id: 'teemo',
      definitionId: teemoChaos.id,
      ownerId: 'a',
      zoneId: 'champion-a',
    },
  );
  s.resources.a = { energy: 1, power: {} };
  return s;
}

it('Swift Scout : cacher peut se payer 1 énergie au lieu d’1 Power', () => {
  const hide = {
    type: 'hide-card' as const,
    playerId: 'a',
    cardId: 'cub',
    battlefieldId: 'f',
    payment: noRunes,
  };
  const s = scenario();
  s.resources.a = { energy: 1, power: {} };
  expect(act(s, hide).ok).toBe(false);
  const paid = step(s, { ...hide, payWithEnergy: true });
  expect(paid.cards.find((c) => c.id === 'cub')?.facedown).toEqual({
    fresh: true,
  });
  expect(paid.resources.a?.energy).toBe(0);
});

it('Swift Scout : 1 énergie, Tap — met en main un Teemo de sa zone champion', () => {
  const s = resolveTop(
    step(scenario(), {
      type: 'activate-gear',
      playerId: 'a',
      gearId: 'scout',
      targetId: 'teemo',
      payment: noRunes,
    }),
  );
  expect(s.cards.find((c) => c.id === 'teemo')?.zoneId).toBe('hand-a');
});
