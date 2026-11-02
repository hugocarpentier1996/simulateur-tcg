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
  kinkouMonk,
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

it('Unité jouée par un effet : sa sélection d’alliées (Kinkou Monk) est demandée à la résolution', () => {
  const s0 = spellScenario(promisingFuture);
  s0.unitDefinitions = [kinkouMonk];
  s0.cards = s0.cards.map((c) =>
    c.id === 'draw-a-0' ? { ...c, definitionId: kinkouMonk.id } : c,
  );
  s0.units.push({ ...s0.units[0]!, id: 'ally2' });
  s0.resources.a = { energy: 5, power: { bleu: 1, orange: 1 } };
  let s = resolveTop(
    step(s0, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'future:draw-a-0' });
  s = step(s, { type: 'choose-mode', playerId: 'b', mode: 'future:draw-b-0' });
  s = passUntilChoice(s);
  const options = s.pendingModeChoice?.playCardOptions ?? [];
  const index = options.findIndex((ids) => ids.join() === 'ally,ally2');
  expect(s.pendingModeChoice?.modes[0]).toBe('skip');
  expect(index).toBeGreaterThanOrEqual(0);
  s = step(s, {
    type: 'choose-mode',
    playerId: 'a',
    mode: `play-card:${index}`,
  });
  expect(
    s.units
      .filter((u) => u.buffed)
      .map((u) => u.id)
      .sort(),
  ).toEqual(['ally', 'ally2']);
});
