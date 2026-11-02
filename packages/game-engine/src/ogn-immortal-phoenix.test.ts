import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import {
  immortalPhoenix,
  hextechRay,
  stupefy,
} from '../../game-data/src/index.js';

it('Immortal Phoenix : quand un sort de son propriétaire tue une unité, payer 1 énergie + 1 Fury la joue du cimetière', () => {
  const s0 = spellScenario(hextechRay);
  s0.unitDefinitions = [immortalPhoenix];
  s0.cards.push({
    id: 'phoenix',
    definitionId: immortalPhoenix.id,
    ownerId: 'a',
    zoneId: 'graveyard-a',
  });
  s0.resources.a = { energy: 2, power: { rouge: 2 } };
  let s = resolveTop(
    step(s0, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(s.stack?.entries.at(-1)).toMatchObject({
    kind: 'mode-choice',
    sourceId: 'phoenix',
  });
  s = resolveTop(s);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'pay-play' });
  expect(s.units.find((u) => u.id === 'phoenix')?.zoneId).toBe('base-a');
  expect(immortalPhoenix.assault).toBe(2);
});

it("Immortal Phoenix : une unité blessée achevée par un malus (Stupefy) n'est pas tuée par les dégâts du sort", () => {
  const s0 = spellScenario(stupefy);
  s0.unitDefinitions = [immortalPhoenix];
  s0.units[1] = { ...s0.units[1]!, might: 2, damage: 1 };
  s0.cards.push({
    id: 'phoenix',
    definitionId: immortalPhoenix.id,
    ownerId: 'a',
    zoneId: 'graveyard-a',
  });
  s0.resources.a = { energy: 3, power: { rouge: 2 } };
  const s = resolveTop(
    step(s0, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(s.stack ?? null).toBeNull();
});

it('Immortal Phoenix : tué par un sort allié, il peut se rejouer lui-même', () => {
  const s0 = spellScenario(hextechRay);
  s0.unitDefinitions = [immortalPhoenix];
  s0.units.push({
    ...s0.units[0]!,
    id: 'phoenix',
    definitionId: immortalPhoenix.id,
    might: 3,
  });
  s0.resources.a = { energy: 2, power: { rouge: 2 } };
  const s = resolveTop(
    step(s0, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'phoenix',
      payment: noRunes,
    }),
  );
  expect(s.cards.find((c) => c.id === 'phoenix')?.zoneId).toBe('graveyard-a');
  expect(s.stack?.entries.at(-1)).toMatchObject({
    kind: 'mode-choice',
    sourceId: 'phoenix',
  });
});
