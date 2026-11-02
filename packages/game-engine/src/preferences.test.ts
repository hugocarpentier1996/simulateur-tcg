import { expect, it } from 'vitest';
import { act, getLegalActions } from './index.js';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { hextechRay } from '../../game-data/src/index.js';

it('set-preference : enregistre une préférence de joueur sans autre changement', () => {
  const s0 = spellScenario(hextechRay);
  const s = step(s0, {
    type: 'set-preference',
    playerId: 'b',
    preference: 'autoPassReactions',
    value: true,
  });
  expect(s.preferences).toEqual({ b: { autoPassReactions: true } });
  expect({ ...s, preferences: undefined }).toEqual({
    ...s0,
    preferences: undefined,
  });
  expect(
    act(s0, {
      type: 'set-preference',
      playerId: 'z',
      preference: 'askOptional',
      value: true,
    }).ok,
  ).toBe(false);
  expect(
    getLegalActions(s0, 'a').some((a) => a.type === 'set-preference'),
  ).toBe(false);
});

it('refus automatique des réactions : le joueur concerné passe dès qu’il reçoit la priorité sur une pile', () => {
  let s = spellScenario(hextechRay);
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  s = step(s, {
    type: 'set-preference',
    playerId: 'b',
    preference: 'autoPassReactions',
    value: true,
  });
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  });
  expect(s.stack?.priorityPlayerId).toBe('a');
  s = step(s, { type: 'pass', playerId: 'a' });
  expect(s.stack ?? null).toBeNull();
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
});

it('refus automatique activé des deux côtés : la pile se résout seule', () => {
  let s = spellScenario(hextechRay);
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  for (const playerId of ['a', 'b'])
    s = step(s, {
      type: 'set-preference',
      playerId,
      preference: 'autoPassReactions',
      value: true,
    });
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  });
  expect(s.stack ?? null).toBeNull();
});
