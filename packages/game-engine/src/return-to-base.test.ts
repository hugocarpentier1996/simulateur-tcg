import { expect, it } from 'vitest';
import { gust } from '../../game-data/src/index.js';
import { spellScenario } from './origins-test-fixtures.js';
import { act } from './act.js';
import { getLegalActions } from './legal/actions.js';
const move = {
  type: 'move' as const,
  playerId: 'a',
  unitId: 'ally',
  destinationId: 'base-a',
};
it('retour Ready vers sa base : Tap, aucun coût ni soin, contrôle libéré et score conservé', () => {
  const s = spellScenario(gust);
  s.units[0]!.damage = 1;
  s.scoredBattlefields = { a: ['f'] };
  expect(getLegalActions(s, 'a')).toContainEqual(move);
  const r = act(s, move);
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.state.units[0]).toMatchObject({
    zoneId: 'base-a',
    ready: false,
    damage: 1,
  });
  expect(r.state.resources).toEqual(s.resources);
  expect(r.state.showdown).toBeNull();
  expect(r.state.battlefields[0]!.controllerId).toBeNull();
  expect(r.state.scoredBattlefields.a).toEqual(['f']);
  expect(s.units[0]!.zoneId).toBe('f');
});
it('refuse Tap, base adverse et changement de lane sans Ganking ; conserve contrôle si un allié reste', () => {
  const s = spellScenario(gust);
  expect(
    act({ ...s, units: s.units.map((u) => ({ ...u, ready: false })) }, move).ok,
  ).toBe(false);
  expect(act(s, { ...move, destinationId: 'base-b' }).ok).toBe(false);
  expect(act(s, { ...move, destinationId: 'g' }).ok).toBe(false);
  s.units.push({ ...s.units[0]!, id: 'remaining' });
  const r = act(s, move);
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.state.battlefields[0]!.controllerId).toBe('a');
});
