import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { gust, crackshotCorsair } from '../../game-data/src/index.js';
import { act } from './act.js';
function setup() {
  const s = spellScenario(gust);
  s.units[0]!.zoneId = 'base-a';
  s.units.push({ ...s.units[0]!, id: 'second' });
  return s;
}
const action = {
  type: 'move-group' as const,
  playerId: 'a',
  moves: [
    { unitId: 'ally', destinationId: 'g' },
    { unitId: 'second', destinationId: 'g' },
  ],
};
it('deux attaquants arrivent ensemble avant un unique combat et ses capacités', () => {
  const s = setup();
  s.unitDefinitions = [crackshotCorsair];
  s.units[0]!.definitionId = crackshotCorsair.id;
  s.units[2]!.definitionId = crackshotCorsair.id;
  const r = act(s, action);
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(
    r.state.units
      .filter((u) => u.ownerId === 'a')
      .every((u) => u.zoneId === 'g' && !u.ready),
  ).toBe(true);
  expect(r.state.showdown).toMatchObject({
    kind: 'combat',
    battlefieldId: 'g',
    initiatorId: 'a',
  });
  expect(r.state.pendingAttackChoices).toHaveLength(2);
  expect(r.events.filter((e) => e.type === 'showdown-opened')).toHaveLength(1);
  expect(s.units[0]!.zoneId).toBe('base-a');
});
it('refus atomique : unité Tap, doublon, liste vide ou destination adverse invalide', () => {
  for (const moves of [
    [],
    [action.moves[0]!, action.moves[0]!],
    [action.moves[0]!, { unitId: 'second', destinationId: 'base-b' }],
  ])
    expect(act(setup(), { ...action, moves }).ok).toBe(false);
  const s = setup();
  s.units[2]!.ready = false;
  expect(act(s, action).ok).toBe(false);
  expect(s.units[0]!.ready).toBe(true);
});
it('deux champs : un seul showdown actif et le suivant reste en attente', () => {
  const s = setup();
  s.battlefields[0]!.controllerId = null;
  const r = act(s, {
    ...action,
    moves: [
      { unitId: 'ally', destinationId: 'g' },
      { unitId: 'second', destinationId: 'f' },
    ],
  });
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.state.showdown?.battlefieldId).toBe('g');
  expect(r.state.pendingShowdowns).toEqual([
    { battlefieldId: 'f', initiatorId: 'a' },
  ]);
});
