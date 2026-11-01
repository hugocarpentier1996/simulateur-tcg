import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { icathianRain } from '../../game-data/src/index.js';

it('Icathian Rain : six fois 2 dégâts, chaque cible choisie à la résolution', () => {
  const s0 = spellScenario(icathianRain);
  s0.units = s0.units.map((u) => ({ ...u, might: 20 }));
  s0.resources.a = { energy: 7, power: { rouge: 2, bleu: 1 } };
  let s = resolveTop(
    step(s0, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  for (let i = 0; i < 6; i++) {
    expect(s.pendingModeChoice?.modes).toEqual(['hit:ally', 'hit:enemy']);
    s = step(s, {
      type: 'choose-mode',
      playerId: 'a',
      mode: i < 4 ? 'hit:enemy' : 'hit:ally',
    });
  }
  expect(s.pendingModeChoice ?? null).toBeNull();
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(8);
  expect(s.units.find((u) => u.id === 'ally')?.damage).toBe(4);
});
