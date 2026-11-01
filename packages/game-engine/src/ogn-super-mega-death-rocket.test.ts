import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { superMegaDeathRocket } from '../../game-data/src/index.js';
import { trashConquerEntries } from './effects/unit-conquer.js';
import { resolveModeChoice } from './effects/mode-choice.js';

it('Super Mega Death Rocket! : inflige 5 à une unité', () => {
  const s = spellScenario(superMegaDeathRocket);
  s.resources.a = { energy: 4, power: { rouge: 1 } };
  s.units[1] = { ...s.units[1]!, might: 9 };
  const after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(after.units.find((u) => u.id === 'enemy')?.damage).toBe(5);
});

it('Super Mega Death Rocket! : à la conquête, défausser 1 le ramène du cimetière en main', () => {
  const s = spellScenario(superMegaDeathRocket);
  s.cards = s.cards.map((c) =>
    c.id === 'spell' ? { ...c, zoneId: 'graveyard-a' } : c,
  );
  s.cards.push({
    id: 'junk',
    definitionId: 'filler',
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.stack = {
    entries: [],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  const [entry] = trashConquerEntries(s, 'a');
  expect(entry).toMatchObject({ kind: 'mode-choice', sourceId: 'spell' });
  const pending = resolveModeChoice(s, entry!).state;
  expect(pending.pendingModeChoice?.modes).toEqual([
    'skip',
    'discard-return:junk',
  ]);
  const after = step(pending, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'discard-return:junk',
  });
  expect(after.cards.find((c) => c.id === 'spell')?.zoneId).toBe('hand-a');
  expect(after.cards.find((c) => c.id === 'junk')?.zoneId).toBe('graveyard-a');
});
