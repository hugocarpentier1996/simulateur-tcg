import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { recruitToken } from '../../game-data/src/index.js';
import { summonToken } from './effects/summon-token.js';
import { startNextTurn } from './turn/progression.js';
import { confront } from '../../game-data/src/index.js';
it('Confront rend les nouvelles unités et Recrues Ready pour ce tour seulement, sans redresser les anciennes', () => {
  let s = spellScenario(confront);
  s.unitDefinitions = [recruitToken];
  s.units[0]!.ready = false;
  s.cards.push({
    id: 'unit',
    definitionId: recruitToken.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
  expect(s.units[0]!.ready).toBe(false);
  s = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'unit',
    payment: noRunes,
  });
  expect(s.units.find((u) => u.id === 'unit')?.ready).toBe(true);
  s = summonToken(s, 'a', 'base-a', recruitToken.id).state;
  expect(s.units.at(-1)?.ready).toBe(true);
  s = summonToken(s, 'b', 'base-b', recruitToken.id).state;
  expect(s.units.at(-1)?.ready).toBe(false);
  s = startNextTurn(s).state;
  s = summonToken(s, 'a', 'base-a', recruitToken.id).state;
  expect(s.units.at(-1)?.ready).toBe(false);
});
