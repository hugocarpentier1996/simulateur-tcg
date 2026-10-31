import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { victoryTarget } from './scoring/victory-target.js';
import { scoreBattlefield } from './scoring/battlefield.js';
import { aspirantsClimb, mobilize } from '../../game-data/src/index.js';

it('Aspirant’s Climb : en jeu, il faut 1 point de plus pour gagner', () => {
  const s = spellScenario(mobilize);
  s.battlefieldDefinitions = [aspirantsClimb];
  expect(victoryTarget(s, 'a')).toBe(8);
  s.battlefields[1]!.definitionId = aspirantsClimb.id;
  expect(victoryTarget(s, 'a')).toBe(9);
  s.players = s.players.map((p) => (p.id === 'a' ? { ...p, score: 7 } : p));
  s.battlefields[0]!.controllerId = 'a';
  const scored = scoreBattlefield(s, 'a', 'f', 'HOLD');
  expect(scored.state.players[0]!.score).toBe(8);
  expect(scored.state.result ?? null).toBeNull();
});
