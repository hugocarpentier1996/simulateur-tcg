import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { startTurn } from './turn/progression.js';
import { obeliskOfPower, gust } from '../../game-data/src/index.js';

it('Obelisk of Power : canalise 1 rune au début de la première Beginning de chaque joueur', () => {
  const s = spellScenario(gust);
  s.battlefieldDefinitions = [obeliskOfPower];
  s.battlefields = s.battlefields.map((f) => ({ ...f, controllerId: null }));
  s.battlefields[1]!.definitionId = obeliskOfPower.id;
  s.cards.push(
    {
      id: 'p0',
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'rune-pile-a',
      color: 'vert',
    },
    {
      id: 'p1',
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'rune-pile-a',
      color: 'vert',
    },
    {
      id: 'p2',
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'rune-pile-a',
      color: 'vert',
    },
  );
  const first = startTurn(s).state;
  expect(first.cards.filter((c) => c.zoneId === 'runes-a')).toHaveLength(3);
  const again = startTurn({ ...first, phase: 'end' }).state;
  expect(again.cards.filter((c) => c.zoneId === 'runes-a')).toHaveLength(3);
});
