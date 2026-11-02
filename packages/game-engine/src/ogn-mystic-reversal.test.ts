import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { mysticReversal, hextechRay } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(mysticReversal);
  s.resources.a = { energy: 4, power: { vert: 3 } };
  s.activePlayerId = 'b';
  s.spellDefinitions = [mysticReversal, hextechRay];
  s.stack = {
    entries: [
      {
        card: {
          id: 'ray',
          definitionId: hextechRay.id,
          ownerId: 'b',
          zoneId: 'hand-b',
        },
        definition: hextechRay,
        casterId: 'b',
        targetId: 'enemy',
      },
    ],
    initiatorId: 'b',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  return s;
}

it('Mystic Reversal : prend le contrôle d’un sort de la pile, qui peut garder ses cibles', () => {
  const s = scenario();
  let after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'ray',
      payment: noRunes,
    }),
  );
  expect(after.stack?.entries[0]).toMatchObject({ casterId: 'a' });
  expect(after.pendingModeChoice?.modes).toEqual(['skip', 'retarget:ally']);
  after = resolveTop(
    step(after, { type: 'choose-mode', playerId: 'a', mode: 'skip' }),
  );
  expect(after.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(after.cards.find((c) => c.id === 'ray')?.zoneId).toBe('graveyard-b');
});

it('Mystic Reversal : « you may make new choices » — nouvelle cible valide au choix', () => {
  const s = scenario();
  s.units.push({ ...s.units[1]!, id: 'enemy2' });
  let after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'ray',
      payment: noRunes,
    }),
  );
  expect(after.pendingModeChoice?.modes).toEqual([
    'skip',
    'retarget:ally',
    'retarget:enemy2',
  ]);
  after = step(after, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'retarget:enemy2',
  });
  after = resolveTop(after);
  expect(after.units.some((u) => u.id === 'enemy2')).toBe(false);
  expect(after.units.some((u) => u.id === 'enemy')).toBe(true);
});
