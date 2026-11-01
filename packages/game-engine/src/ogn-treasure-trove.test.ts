import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { thermoBeam, treasureTrove } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(thermoBeam);
  s.gearDefinitions = [treasureTrove];
  s.gears = [
    {
      id: 'trove',
      definitionId: treasureTrove.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  s.cards.push({
    id: 'rune-0',
    definitionId: 'rune',
    ownerId: 'a',
    zoneId: 'rune-pile-a',
    color: 'violet',
  });
  return s;
}
function expectLooted(s: ReturnType<typeof scenario>) {
  expect(s.gears ?? []).toEqual([]);
  expect(s.cards.find((c) => c.id === 'trove')?.zoneId).toBe('graveyard-a');
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
  expect(s.cards.find((c) => c.id === 'rune-0')).toMatchObject({
    zoneId: 'runes-a',
    ready: false,
  });
}

it('Treasure Trove : 1 Power Chaos + Tap, il se détruit ; sa sortie pioche 1 et canalise 1 rune Tap', () => {
  const s = scenario();
  s.resources.a = { energy: 0, power: { violet: 1 } };
  expect(
    getLegalActions(s, 'a').some(
      (a) => a.type === 'activate-gear' && a.gearId === 'trove',
    ),
  ).toBe(true);
  expectLooted(
    resolveTop(
      step(s, {
        type: 'activate-gear',
        playerId: 'a',
        gearId: 'trove',
        payment: noRunes,
      }),
    ),
  );
});

it('Treasure Trove : détruit par un sort, la même récompense s’applique', () => {
  const s = scenario();
  s.resources.a = { energy: 5, power: { rouge: 2 } };
  expectLooted(
    resolveTop(
      step(s, {
        type: 'cast-spell',
        playerId: 'a',
        cardId: 'spell',
        targetId: 'a',
        payment: noRunes,
      }),
    ),
  );
});
