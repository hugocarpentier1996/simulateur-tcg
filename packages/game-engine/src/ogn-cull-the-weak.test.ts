import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { cullTheWeak } from '../../game-data/src/index.js';

it('Cull the Weak : chaque joueur tue une de ses unités, le lanceur d’abord', () => {
  const s = spellScenario(cullTheWeak);
  s.resources.a = { energy: 2, power: { jaune: 1 } };
  s.units.push(
    { ...s.units[0]!, id: 'ally2' },
    { ...s.units[1]!, id: 'enemy2' },
  );
  let after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(after.pendingModeChoice).toMatchObject({
    ownerId: 'a',
    modes: ['kill-own:ally', 'kill-own:ally2'],
  });
  after = step(after, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'kill-own:ally2',
  });
  expect(after.pendingModeChoice).toMatchObject({
    ownerId: 'b',
    modes: ['kill-own:enemy', 'kill-own:enemy2'],
  });
  after = step(after, {
    type: 'choose-mode',
    playerId: 'b',
    mode: 'kill-own:enemy',
  });
  expect(after.pendingModeChoice ?? null).toBeNull();
  expect(after.units.map((u) => u.id)).toEqual(['ally', 'enemy2']);
});

it('Cull the Weak : un joueur sans unité est passé', () => {
  const s = spellScenario(cullTheWeak);
  s.resources.a = { energy: 2, power: { jaune: 1 } };
  s.units = [s.units[1]!];
  const after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(after.pendingModeChoice).toMatchObject({ ownerId: 'b' });
});
