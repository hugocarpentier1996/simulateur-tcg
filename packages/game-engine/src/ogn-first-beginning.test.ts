import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { startTurn } from './turn/progression.js';
import { theArenasGreatest, gust } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(gust);
  s.battlefieldDefinitions = [theArenasGreatest];
  s.battlefields = s.battlefields.map((f) => ({ ...f, controllerId: null }));
  s.cards.push({
    id: 'pile-0',
    definitionId: 'rune',
    ownerId: 'a',
    zoneId: 'rune-pile-a',
    color: 'vert',
  });
  return s;
}

it('The Arena’s Greatest : 1 point au début de la première Beginning de chaque joueur', () => {
  const s = scenario();
  s.battlefields[1]!.definitionId = theArenasGreatest.id;
  const first = startTurn(s).state;
  expect(first.players[0]!.score).toBe(1);
  expect(first.firstBeginningDone).toEqual(['a']);
  const again = startTurn({ ...first, phase: 'end' }).state;
  expect(again.players[0]!.score).toBe(1);
});
