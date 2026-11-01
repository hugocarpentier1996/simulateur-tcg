import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import {
  guerillaWarfare,
  pakaaCub,
  kinkouMonk,
} from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(guerillaWarfare);
  s.unitDefinitions = [pakaaCub, kinkouMonk];
  s.cards.push(
    {
      id: 'h1',
      definitionId: pakaaCub.id,
      ownerId: 'a',
      zoneId: 'graveyard-a',
    },
    {
      id: 'h2',
      definitionId: pakaaCub.id,
      ownerId: 'a',
      zoneId: 'graveyard-a',
    },
    {
      id: 'm',
      definitionId: kinkouMonk.id,
      ownerId: 'a',
      zoneId: 'graveyard-a',
    },
  );
  s.resources.a = { energy: 2, power: { bleu: 1 } };
  return s;
}
const cast = (selectedUnitIds: string[]) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'a',
  selectedUnitIds,
  payment: noRunes,
});

it('Guerilla Warfare : reprend jusqu’à 2 cartes Hidden du cimetière ; cacher est gratuit ce tour', () => {
  const s = resolveTop(step(scenario(), cast(['h1', 'h2'])));
  expect(s.cards.filter((c) => c.zoneId === 'hand-a').map((c) => c.id)).toEqual(
    ['h1', 'h2'],
  );
  s.resources.a = { energy: 0, power: {} };
  const hidden = step(s, {
    type: 'hide-card',
    playerId: 'a',
    cardId: 'h1',
    battlefieldId: 'f',
    payment: noRunes,
  });
  expect(hidden.cards.find((c) => c.id === 'h1')?.facedown).toEqual({
    fresh: true,
  });
});

it('Guerilla Warfare : seulement des cartes Hidden de son cimetière, deux au plus', () => {
  expect(act(scenario(), cast(['m'])).ok).toBe(false);
  const options = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'cast-spell' ? [a.selectedUnitIds?.join('+')] : [],
  );
  expect(new Set(options)).toEqual(new Set(['', 'h1', 'h2', 'h1+h2']));
});
