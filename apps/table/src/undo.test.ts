import { expect, it } from 'vitest';
import { createDemo, dispatch, placeUnit, undo } from './session.js';

it('annule une mise en jeu avec son paiement et restaure le journal', () => {
  const initial = createDemo();
  const played = placeUnit(initial, 'a-chosen', 'zone:a:base');
  expect(played.state.units).toHaveLength(1);
  expect(undo(played)).toEqual(initial);
  expect(played.state.units).toHaveLength(1);
});

it('annule une fin de tour avec la pioche, le Channel et le changement de joueur', () => {
  const initial = createDemo();
  const next = dispatch(initial, { type: 'end-turn', playerId: 'a' });
  expect(next.state.activePlayerId).toBe('b');
  expect(undo(next)).toEqual(initial);
});

it('conserve uniquement les dix dernières actions réussies', () => {
  let session = createDemo();
  const states = [session];
  for (let i = 0; i < 13; i++) {
    session = dispatch(session, {
      type: 'end-turn',
      playerId: session.state.activePlayerId,
    });
    expect(session.error).toBeNull();
    states.push(session);
  }
  expect(session.history).toHaveLength(10);
  for (let i = 0; i < 10; i++) session = undo(session);
  expect(session.state).toEqual(states[3]!.state);
  expect(session.log).toEqual(states[3]!.log);
  expect(session.history).toHaveLength(0);
  expect(undo(session)).toBe(session);
});

it('ignore les refus et permet de repartir sur une autre action après annulation', () => {
  const initial = createDemo();
  const played = placeUnit(initial, 'a-chosen', 'zone:a:base');
  const refused = placeUnit(played, 'a-card-0', 'zone:a:base');
  expect(refused.error).toBeTruthy();
  expect(refused.history).toHaveLength(1);
  const restored = undo(refused);
  expect(restored).toEqual(initial);
  const alternative = placeUnit(restored, 'a-card-0', 'zone:a:base');
  expect(alternative.history).toHaveLength(1);
  expect(undo(alternative)).toEqual(initial);
  expect(createDemo().history).toHaveLength(0);
});
