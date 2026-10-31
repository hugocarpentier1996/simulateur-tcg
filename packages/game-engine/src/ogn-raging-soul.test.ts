import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import {
  ragingSoul,
  chemtechEnforcer,
  mobilize,
} from '../../game-data/src/index.js';

it('Raging Soul : après une défausse ce tour, Ganking (et Assault)', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [ragingSoul, chemtechEnforcer];
  s.cards[0]!.definitionId = chemtechEnforcer.id;
  s.units[0] = { ...s.units[0]!, definitionId: ragingSoul.id };
  s.units = s.units.filter((u) => u.id !== 'enemy');
  s.battlefields = s.battlefields.map((f) => ({ ...f, controllerId: 'a' }));
  s.cards.push({ id: 'h0', definitionId: 'x', ownerId: 'a', zoneId: 'hand-a' });
  s.resources.a = { energy: 2, power: {} };
  const gank = {
    type: 'move' as const,
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  };
  expect(act(s, gank).ok).toBe(false);
  s = resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      payment: noRunes,
    }),
  );
  s = step(s, { type: 'choose-discard', playerId: 'a', cardId: 'h0' });
  expect(s.discardedThisTurn).toEqual(['a']);
  expect(act(s, gank).ok).toBe(true);
  expect(ragingSoul.ifDiscardedThisTurn).toEqual({ assault: 1, ganking: true });
});
