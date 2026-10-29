import { expect, it } from 'vitest';
import { createDemo, dispatch, undo } from './session.js';
import { planMove, confirmMoves } from './move-plan.js';
import { renderTable } from './view.js';
it('prépare deux mouvements sans changer la partie, puis valide en une action annulable', () => {
  const s = createDemo(true);
  const field = s.state.battlefields[0]!.zoneId;
  s.state.units = ['u1', 'u2'].map((id) => ({
    id,
    definitionId: 'ogn-210-298',
    ownerId: 'a',
    zoneId: 'zone:a:base',
    ready: true,
    might: 2,
    damage: 0,
  }));
  let moves = planMove(s, [], 'u1', field);
  moves = planMove(s, moves, 'u2', field);
  expect(s.state.showdown).toBeNull();
  expect(s.history).toHaveLength(0);
  expect(renderTable(s, null, moves)).toContain('Valider les déplacements (2)');
  const result = confirmMoves(s, moves);
  expect(result.state.showdown?.kind).toBe('open');
  expect(result.history).toHaveLength(1);
  expect(undo(result)).toEqual(s);
});
it('revérifie un plan devenu illégal sans modifier l’état', () => {
  const s = createDemo(true);
  s.state.units = [
    {
      id: 'u',
      definitionId: 'ogn-210-298',
      ownerId: 'a',
      zoneId: 'zone:a:base',
      ready: true,
      might: 2,
      damage: 0,
    },
  ];
  const moves = planMove(s, [], 'u', s.state.battlefields[0]!.zoneId);
  const next = dispatch(s, { type: 'end-turn', playerId: 'a' });
  expect(confirmMoves(next, moves).state).toBe(next.state);
});
