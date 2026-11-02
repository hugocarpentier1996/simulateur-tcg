import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  drain,
} from './origins-test-fixtures.js';
import {
  kaiSaMind,
  consultThePast,
  stupefy,
} from '../../game-data/src/index.js';
import { unitConquerEntries } from './effects/unit-conquer.js';
import type { GameState } from './types.js';

it('Kai’Sa (Mind) : à la conquête, rejoue un sort du cimetière d’énergie < ses points, puis le recycle', () => {
  const s0 = spellScenario(stupefy);
  s0.unitDefinitions = [kaiSaMind];
  s0.spellDefinitions = [stupefy, consultThePast];
  s0.units[0] = { ...s0.units[0]!, id: 'kaisa', definitionId: kaiSaMind.id };
  s0.players = s0.players.map((p) => (p.id === 'a' ? { ...p, score: 5 } : p));
  s0.cards.push({
    id: 'past',
    definitionId: consultThePast.id,
    ownerId: 'a',
    zoneId: 'graveyard-a',
  });
  s0.stack = {
    entries: [],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  const [entry] = unitConquerEntries(s0, 'a', 'f');
  let s: GameState = { ...s0, stack: { ...s0.stack!, entries: [entry!] } };
  s = resolveTop(s);
  expect(s.pendingModeChoice?.modes).toEqual(['skip', 'kaisa:past']);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'kaisa:past' });
  s = drain(s);
  expect(s.cards.filter((c) => c.zoneId === 'hand-a')).toHaveLength(3);
  expect(s.cards.at(-1)).toMatchObject({ id: 'past', zoneId: 'deck-a' });
});

it('Kai’Sa (Mind) : un sort à cible est aussi rejouable, sa cible est choisie à sa mise sur la pile', () => {
  const s0 = spellScenario(stupefy);
  s0.unitDefinitions = [kaiSaMind];
  s0.units[0] = { ...s0.units[0]!, id: 'kaisa', definitionId: kaiSaMind.id };
  s0.players = s0.players.map((p) => (p.id === 'a' ? { ...p, score: 5 } : p));
  s0.cards.push({
    id: 'stu',
    definitionId: stupefy.id,
    ownerId: 'a',
    zoneId: 'graveyard-a',
  });
  s0.stack = {
    entries: [],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  const [entry] = unitConquerEntries(s0, 'a', 'f');
  let s: GameState = { ...s0, stack: { ...s0.stack!, entries: [entry!] } };
  s = resolveTop(s);
  expect(s.pendingModeChoice?.modes).toEqual(['skip', 'kaisa:stu']);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'kaisa:stu' });
  s = resolveTop(s);
  expect(s.pendingModeChoice?.castOptions?.map((o) => o.targetId)).toEqual([
    'kaisa',
    'enemy',
  ]);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'cast-option:1' });
  s = drain(s);
  expect(
    s.units.find((u) => u.id === 'enemy')?.temporaryEffects,
  ).toContainEqual({
    type: 'modify-might',
    amount: -1,
  });
  expect(s.cards.find((c) => c.id === 'stu')?.zoneId).toBe('deck-a');
});
