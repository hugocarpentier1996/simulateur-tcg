import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import {
  spectralMatron,
  pakaaCub,
  kinkouMonk,
  stupefy,
} from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [spectralMatron, pakaaCub, kinkouMonk];
  s.cards.push(
    {
      id: 'matron',
      definitionId: spectralMatron.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    },
    {
      id: 'cub',
      definitionId: pakaaCub.id,
      ownerId: 'a',
      zoneId: 'graveyard-a',
    },
    {
      id: 'monk',
      definitionId: kinkouMonk.id,
      ownerId: 'a',
      zoneId: 'graveyard-a',
    },
  );
  s.resources.a = { energy: 4, power: { jaune: 2 } };
  return s;
}
const play = (returnSpellId?: string) => ({
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'matron',
  ...(returnSpellId ? { returnSpellId } : {}),
  payment: noRunes,
});

it('Spectral Matron : joue gratuitement une unité à 3 énergie / 1 Power au plus de son cimetière', () => {
  const s = resolveTop(step(scenario(), play('cub')));
  expect(s.units.find((u) => u.id === 'cub')?.zoneId).toBe('base-a');
  expect(act(scenario(), play('monk')).ok).toBe(false);
  const options = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'play-unit' && a.destinationId === 'base-a'
      ? [a.returnSpellId ?? '']
      : [],
  );
  expect(new Set(options)).toEqual(new Set(['', 'cub']));
});
