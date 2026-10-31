import { expect, it } from 'vitest';
import { ahriCalm, gust } from '../../game-data/src/index.js';
import { spellScenario, resolveTop } from './origins-test-fixtures.js';
import { startTurn } from './turn/progression.js';

function setup() {
  const s = spellScenario(gust);
  s.unitDefinitions = [ahriCalm];
  s.units[0] = { ...s.units[0]!, definitionId: ahriCalm.id, might: 4 };
  return s;
}

it('Ahri : quand elle tient son champ, son propriétaire marque 1 point de plus après réactions', () => {
  let s = startTurn(setup()).state;
  expect(s.players[0]!.score).toBe(1);
  expect(s.stack?.entries.at(-1)).toMatchObject({
    kind: 'hold-unit',
    sourceId: 'ally',
  });
  s = resolveTop(s);
  expect(s.players[0]!.score).toBe(2);
  expect(s.phase).toBe('main');
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
});

it('Ahri hors du champ tenu : aucun point supplémentaire', () => {
  const input = setup();
  input.units[0]!.zoneId = 'base-a';
  input.units.push({
    ...input.units[0]!,
    id: 'holder',
    definitionId: 'test',
    zoneId: 'f',
  });
  const s = startTurn(input).state;
  expect(s.players[0]!.score).toBe(1);
  expect(s.stack ?? null).toBeNull();
});

it('le point d’Ahri peut donner la victoire', () => {
  const input = setup();
  input.players[0]!.score = 6;
  const s = resolveTop(startTurn(input).state);
  expect(s.result).toMatchObject({ winnerId: 'a', reason: 'POINTS' });
});
