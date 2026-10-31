import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { lastStand } from '../../game-data/src/index.js';

it('Last Stand : double la Might d’un allié ce tour et le rend Temporary', () => {
  let s = spellScenario(lastStand);
  s.resources.a = { energy: 3, power: { vert: 1 } };
  s.units[0] = { ...s.units[0]!, might: 4 };
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'ally',
      payment: noRunes,
    }),
  );
  const ally = s.units.find((u) => u.id === 'ally')!;
  expect(effectiveMight(ally, s)).toBe(8);
  expect(ally.temporary).toBe(true);
});

it('Temporary : l’unité meurt au début de la Beginning de son contrôleur, avant le score', () => {
  let s = spellScenario(lastStand);
  s.units[0] = { ...s.units[0]!, temporary: true };
  s.battlefields[0]!.controllerId = 'a';
  s = step(s, { type: 'end-turn', playerId: 'a' });
  expect(s.units.some((u) => u.id === 'ally')).toBe(true);
  s = step(s, { type: 'end-turn', playerId: 'b' });
  expect(s.units.some((u) => u.id === 'ally')).toBe(false);
  expect(s.players.find((p) => p.id === 'a')?.score).toBe(0);
});
