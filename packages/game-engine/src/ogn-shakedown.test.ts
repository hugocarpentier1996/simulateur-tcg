import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { shakedown } from '../../game-data/src/index.js';

function cast() {
  const s = spellScenario(shakedown);
  s.resources.a = { energy: 2, power: { rouge: 1 } };
  s.units[1] = { ...s.units[1]!, might: 9 };
  return resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
}

it('Shakedown : le contrôleur de l’unité choisit 6 dégâts ou de faire piocher 2', () => {
  const s = cast();
  expect(s.pendingModeChoice).toMatchObject({
    ownerId: 'b',
    modes: ['suffer:enemy', 'let-draw'],
  });
  const hurt = step(s, {
    type: 'choose-mode',
    playerId: 'b',
    mode: 'suffer:enemy',
  });
  expect(hurt.units.find((u) => u.id === 'enemy')?.damage).toBe(6);
  const drawn = step(s, {
    type: 'choose-mode',
    playerId: 'b',
    mode: 'let-draw',
  });
  expect(drawn.units.find((u) => u.id === 'enemy')?.damage).toBe(0);
  expect(drawn.cards.filter((c) => c.zoneId === 'hand-a')).toHaveLength(2);
});
