import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
  passUntilChoice,
} from './origins-test-fixtures.js';
import {
  blastconeFae,
  lecturingYordle,
  promisingFuture,
} from '../../game-data/src/index.js';

function scenario(definitionId: string) {
  const s = spellScenario(promisingFuture);
  s.unitDefinitions = [lecturingYordle, blastconeFae];
  s.cards = s.cards.map((c) =>
    c.id.startsWith('draw-') ? { ...c, definitionId } : c,
  );
  s.resources.a = { energy: 5, power: { bleu: 2 } };
  let next = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  next = step(next, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'future:draw-a-0',
  });
  return step(next, {
    type: 'choose-mode',
    playerId: 'b',
    mode: 'future:draw-b-0',
  });
}

it('Unité jouée par un effet : elle arrive Tap et ses effets « when you play me » sont empilés', () => {
  let s = scenario(lecturingYordle.id);
  expect(s.units.find((u) => u.id === 'draw-a-0')?.ready).toBe(false);
  expect(
    s.stack?.entries.some((e) => 'sourceId' in e && e.sourceId === 'draw-a-0'),
  ).toBe(true);
  while (s.stack)
    s = step(s, { type: 'pass', playerId: s.stack.priorityPlayerId });
  // Chaque joueur pioche grâce au Lecturing Yordle qu'il a joué.
  expect(s.cards.filter((c) => c.zoneId === 'hand-a')).toHaveLength(1);
  expect(s.cards.filter((c) => c.zoneId === 'hand-b')).toHaveLength(1);
});

it('Unité jouée par un effet : sa capacité ciblée fait choisir la cible à la résolution', () => {
  let s = passUntilChoice(scenario(blastconeFae.id));
  expect(s.pendingModeChoice?.modes).toContain('play-target:enemy');
  s = step(s, {
    type: 'choose-mode',
    playerId: s.pendingModeChoice!.ownerId,
    mode: 'play-target:enemy',
  });
  expect(
    s.units.find((u) => u.id === 'enemy')?.temporaryEffects,
  ).toContainEqual({ type: 'modify-might', amount: -2 });
});
