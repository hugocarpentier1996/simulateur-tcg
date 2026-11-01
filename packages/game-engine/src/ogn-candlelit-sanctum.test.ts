import { expect, it } from 'vitest';
import { spellScenario, step } from './origins-test-fixtures.js';
import { theCandlelitSanctum, stupefy } from '../../game-data/src/index.js';
import { resolveModeChoice, sanctumEntry } from './effects/mode-choice.js';

function pending() {
  const s = spellScenario(stupefy);
  s.stack = {
    entries: [],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  return resolveModeChoice(s, sanctumEntry('f', 'a')).state;
}
const deck = (s: ReturnType<typeof pending>) =>
  s.cards.filter((c) => c.zoneId === 'deck-a').map((c) => c.id);

it('The Candlelit Sanctum : regarde les 2 cartes du dessus, en recycle et réordonne les autres', () => {
  const s = pending();
  expect(s.pendingModeChoice?.modes).toEqual([
    'arrange:draw-a-0+draw-a-1',
    'arrange:draw-a-1+draw-a-0',
    'arrange:draw-a-0',
    'arrange:draw-a-1',
    'arrange:',
  ]);
  expect(
    deck(
      step(s, {
        type: 'choose-mode',
        playerId: 'a',
        mode: 'arrange:draw-a-1+draw-a-0',
      }),
    ),
  ).toEqual(['draw-a-1', 'draw-a-0', 'draw-a-2']);
  expect(
    deck(
      step(s, { type: 'choose-mode', playerId: 'a', mode: 'arrange:draw-a-1' }),
    ),
  ).toEqual(['draw-a-1', 'draw-a-2', 'draw-a-0']);
});

it('The Candlelit Sanctum : la carte déclare 2 cartes à arranger', () => {
  expect(theCandlelitSanctum.conquerArrangeTop).toBe(2);
});
