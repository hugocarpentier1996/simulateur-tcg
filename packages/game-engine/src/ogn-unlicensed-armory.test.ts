import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { unlicensedArmory, hextechRay } from '../../game-data/src/index.js';

function armed(fury: number) {
  const s0 = spellScenario(hextechRay);
  s0.gearDefinitions = [unlicensedArmory];
  s0.gears = [
    {
      id: 'armory',
      definitionId: unlicensedArmory.id,
      ownerId: 'b',
      zoneId: 'base-b',
      ready: true,
    },
  ];
  s0.activePlayerId = 'b';
  s0.priorityPlayerId = 'b';
  s0.units[1] = { ...s0.units[1]!, might: 2 };
  s0.cards.push({
    id: 'junk',
    definitionId: 'filler',
    ownerId: 'b',
    zoneId: 'hand-b',
  });
  const use = {
    type: 'activate-gear' as const,
    playerId: 'b',
    gearId: 'armory',
    targetId: 'enemy',
    discardCardId: 'junk',
    payment: noRunes,
  };
  expect(act(s0, { ...use, discardCardId: undefined } as never).ok).toBe(false);
  let s = resolveTop(step(s0, use));
  expect(s.cards.find((c) => c.id === 'junk')?.zoneId).toBe('graveyard-b');
  s = { ...s, activePlayerId: 'a', priorityPlayerId: 'a' };
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  s.resources.b = { energy: 0, power: fury ? { rouge: fury } : {} };
  return resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
}

it('Unlicensed Armory : défausser 1 + Tap ; l’alliée choisie peut être rappelée en payant 1 Fury à sa mort', () => {
  const s = armed(1);
  expect(s.units.find((u) => u.id === 'enemy')).toMatchObject({
    zoneId: 'base-b',
    ready: false,
  });
  expect(s.resources.b?.power.rouge ?? 0).toBe(0);
});

it('Unlicensed Armory : sans Power Fury, l’unité meurt', () => {
  expect(armed(0).units.some((u) => u.id === 'enemy')).toBe(false);
});

it('Unlicensed Armory : une option par carte à défausser', () => {
  const s = spellScenario(hextechRay);
  s.gearDefinitions = [unlicensedArmory];
  s.gears = [
    {
      id: 'armory',
      definitionId: unlicensedArmory.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  const options = getLegalActions(s, 'a').filter(
    (a) => a.type === 'activate-gear' && a.gearId === 'armory',
  );
  expect(options).toContainEqual(
    expect.objectContaining({ targetId: 'ally', discardCardId: 'spell' }),
  );
});
