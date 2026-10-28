import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { mobilize, travelingMerchant } from '../../game-data/src/index.js';
import { act } from './act.js';
import { queueMovementEffects } from './effects/movement-triggers.js';
import { maddenedMarauder } from '../../game-data/src/index.js';
it.each(['enemy', 'spell'])(
  'Marauder déplace en base sans soin ni épuisement, cible %s',
  (target) => {
    let s = spellScenario(mobilize);
    s.unitDefinitions = [maddenedMarauder];
    s.cards[0]!.definitionId = maddenedMarauder.id;
    s.units[1]!.damage = 1;
    const play = {
      type: 'play-unit' as const,
      playerId: 'a',
      cardId: 'spell',
      destinationId: 'f',
      payment: noRunes,
      onPlayTargetId: target,
    };
    expect(act(s, { ...play, onPlayTargetId: 'absent' }).ok).toBe(false);
    s = step(s, play);
    expect(s.units.find((u) => u.id === 'spell')?.tank).toBe(true);
    s = resolveTop(s);
    expect(s.units.find((u) => u.id === target)).toMatchObject({
      zoneId: target === 'enemy' ? 'base-b' : 'base-a',
      ready: target === 'enemy',
      damage: target === 'enemy' ? 1 : 0,
    });
  },
);
it('Highlander reste un rappel et ne déclenche pas Merchant', () => {
  const before = spellScenario(mobilize);
  before.unitDefinitions = [travelingMerchant];
  before.units[0]!.definitionId = travelingMerchant.id;
  const after = {
    ...before,
    units: before.units.map((u) =>
      u.id === 'ally' ? { ...u, zoneId: 'base-a' } : u,
    ),
  };
  expect(
    queueMovementEffects(before, after, [
      { type: 'unit-recalled', unitId: 'ally', zoneId: 'base-a' },
    ]).state.stack,
  ).toBeUndefined();
});
