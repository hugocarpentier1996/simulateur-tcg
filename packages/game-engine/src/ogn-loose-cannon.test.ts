import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { startTurn } from './turn/progression.js';
import { looseCannon, gust } from '../../game-data/src/index.js';

function scenario(hand: number) {
  const s = spellScenario(gust);
  s.legendDefinitions = [looseCannon];
  s.battlefields = s.battlefields.map((f) => ({ ...f, controllerId: null }));
  s.zones.push({ id: 'legend-a', kind: 'legend', ownerId: 'a' });
  s.cards.push({
    id: 'cannon',
    definitionId: looseCannon.id,
    ownerId: 'a',
    zoneId: 'legend-a',
    ready: true,
  });
  s.cards = s.cards.filter((c) => c.zoneId !== 'hand-a');
  for (let i = 0; i < hand; i++)
    s.cards.push({
      id: `h${i}`,
      definitionId: 'x',
      ownerId: 'a',
      zoneId: 'hand-a',
    });
  return s;
}

it('Loose Cannon : au début de la Beginning, pioche 1 si la main a 1 carte ou moins', () => {
  const low = startTurn(scenario(1)).state;
  expect(low.stack?.entries.at(-1)).toMatchObject({
    kind: 'legend-draw',
    sourceId: 'cannon',
    count: 1,
  });
  const high = startTurn(scenario(2)).state;
  expect(high.stack ?? null).toBeNull();
});
