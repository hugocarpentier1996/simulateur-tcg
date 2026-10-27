import { expect, it } from 'vitest';
import {
  createDemo,
  dispatch,
  placeUnit,
  boardOptions,
  playOrMove,
  passShowdown,
  undo,
} from './session.js';

function prepared() {
  let s = placeUnit(createDemo(), 'a-card-0', 'zone:a:base');
  s = dispatch(s, { type: 'end-turn', playerId: 'a' });
  return dispatch(s, { type: 'end-turn', playerId: 'b' });
}

it('refuse les unités Tap et adverses, puis autorise les champs libres après Awaken', () => {
  const tapped = placeUnit(createDemo(), 'a-card-0', 'zone:a:base');
  expect(boardOptions(tapped.state, 'a-card-0')).toEqual([]);
  const ready = prepared();
  expect(
    boardOptions(ready.state, 'a-card-0').map((a) => a.destinationId),
  ).toEqual(ready.state.battlefields.map((b) => b.zoneId));
  const enemyTurn = dispatch(ready, { type: 'end-turn', playerId: 'a' });
  expect(boardOptions(enemyTurn.state, 'a-card-0')).toEqual([]);
  const refused = playOrMove(ready, 'a-card-0', 'zone:b:base');
  expect(refused.error).toBeTruthy();
  expect(refused.state).toBe(ready.state);
});

it('conquiert après deux passes puis score la tenue au prochain début de tour', () => {
  const ready = prepared();
  const field = ready.state.battlefields[0]!.zoneId;
  let s = playOrMove(ready, 'a-card-0', field);
  expect(s.state.units[0]).toMatchObject({ zoneId: field, ready: false });
  expect(s.state.showdown?.kind).toBe('open');
  expect(s.state.players[0]!.score).toBe(0);
  expect(s.state.resources).toEqual(ready.state.resources);
  expect(undo(s)).toEqual(ready);
  expect(boardOptions(s.state, 'a-chosen')).toEqual([]);
  expect(dispatch(s, { type: 'end-turn', playerId: 'a' }).error).toBeTruthy();
  s = passShowdown(s);
  expect(s.state.showdown?.priorityPlayerId).toBe('b');
  expect(s.state.players[0]!.score).toBe(0);
  const beforeConquest = s;
  s = passShowdown(s);
  expect(s.state.showdown).toBeNull();
  expect(s.state.battlefields[0]!.controllerId).toBe('a');
  expect(s.state.players[0]!.score).toBe(1);
  expect(s.log.some((line) => line.includes('conquête'))).toBe(true);
  expect(undo(s)).toEqual(beforeConquest);
  s = dispatch(s, { type: 'end-turn', playerId: 'a' });
  expect(s.state.players[0]!.score).toBe(1);
  s = dispatch(s, { type: 'end-turn', playerId: 'b' });
  expect(s.state.players[0]!.score).toBe(2);
  expect(s.log.some((line) => line.includes('tenue'))).toBe(true);
  expect(passShowdown(s).state).toBe(s.state);
});

it('renforce son champ sans nouveau score et masque les attaques non encore gérées par la table', () => {
  let s = prepared();
  const field = s.state.battlefields[0]!.zoneId;
  s = playOrMove(s, 'a-card-0', field);
  s = passShowdown(passShowdown(s));
  s = placeUnit(s, 'a-chosen', 'zone:a:base');
  s = dispatch(s, { type: 'end-turn', playerId: 'a' });
  s = placeUnit(s, 'b-card-0', 'zone:b:base');
  s = dispatch(s, { type: 'end-turn', playerId: 'b' });
  const score = s.state.players[0]!.score;
  s = playOrMove(s, 'a-chosen', field);
  expect(s.error).toBeNull();
  expect(s.state.showdown).toBeNull();
  expect(s.state.players[0]!.score).toBe(score);
  s = dispatch(s, { type: 'end-turn', playerId: 'a' });
  expect(
    boardOptions(s.state, 'b-card-0').map((a) => a.destinationId),
  ).not.toContain(field);
  expect(playOrMove(s, 'b-card-0', field).state).toBe(s.state);
});
