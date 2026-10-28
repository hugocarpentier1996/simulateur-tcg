import { expect, it } from 'vitest';
import { act } from './index.js';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { gust } from '../../game-data/src/index.js';
const cast = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'enemy',
  payment: noRunes,
};
it('Gust renvoie une carte neuve en main, détache le gear et ne déclenche pas une mort', () => {
  const s = spellScenario(gust);
  s.units[1]!.damage = 1;
  s.units[1]!.temporaryEffects = [{ type: 'stun' }];
  s.gears = [
    {
      id: 'gear',
      definitionId: 'test',
      ownerId: 'b',
      zoneId: 'g',
      ready: true,
      attachedUnitId: 'enemy',
    },
  ];
  const next = resolveTop(step(s, cast));
  expect(next.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(next.cards.find((c) => c.id === 'enemy')).toEqual({
    id: 'enemy',
    definitionId: 'test',
    ownerId: 'b',
    zoneId: 'hand-b',
  });
  expect(next.gears![0]).toMatchObject({ zoneId: 'base-b' });
  expect(next.gears![0]!.attachedUnitId).toBeUndefined();
  expect(next.pendingDeaths).toBeUndefined();
  expect(next.battlefields[1]!.controllerId).toBeNull();
});
it('revérifie la Might modifiée et la présence sur un champ ; le coût reste payé', () => {
  const s = spellScenario(gust);
  s.units[1]!.temporaryEffects = [{ type: 'modify-might', amount: 1 }];
  expect(act(s, cast)).toEqual({ ok: false, reason: 'INVALID_TARGET' });
  s.units[1]!.temporaryEffects = [];
  let next = step(s, cast);
  next.units[1]!.temporaryEffects = [{ type: 'modify-might', amount: 1 }];
  next = resolveTop(next);
  expect(next.units.some((u) => u.id === 'enemy')).toBe(true);
  expect(next.resources.a!.energy).toBe(9);
  expect(next.cards.find((c) => c.id === 'spell')!.zoneId).toBe('graveyard-a');
});
it('un jeton renvoyé disparaît et le contrôle du défenseur reste acquis pendant son showdown', () => {
  const s = spellScenario(gust);
  s.units[1]!.token = true;
  s.showdown = {
    kind: 'open',
    battlefieldId: 'g',
    initiatorId: 'a',
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  const next = resolveTop(step(s, cast));
  expect(next.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(next.cards.some((c) => c.id === 'enemy')).toBe(false);
  expect(next.battlefields[1]!.controllerId).toBe('b');
});
