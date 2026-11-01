import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { kingsEdict } from '../../game-data/src/index.js';

it('King’s Edict : l’adversaire choisit une de ses unités, qui meurt', () => {
  const s = spellScenario(kingsEdict);
  s.resources.a = { energy: 6, power: { jaune: 2 } };
  s.units.push({ ...s.units[1]!, id: 'enemy2' });
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
    ownerId: 'b',
    modes: ['kill-own:enemy', 'kill-own:enemy2'],
  });
  after = step(after, {
    type: 'choose-mode',
    playerId: 'b',
    mode: 'kill-own:enemy2',
  });
  expect(after.pendingModeChoice ?? null).toBeNull();
  expect(after.units.map((u) => u.id)).toEqual(['ally', 'enemy']);
});
