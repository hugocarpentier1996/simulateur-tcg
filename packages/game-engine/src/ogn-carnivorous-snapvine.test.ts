import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { carnivorousSnapvine, flash } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(flash);
  s.unitDefinitions = [carnivorousSnapvine];
  s.cards.push({
    id: 'vine',
    definitionId: carnivorousSnapvine.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 5, power: { orange: 2 } };
  s.units.push({ ...s.units[1]!, id: 'home', zoneId: 'base-b' });
  return s;
}

it('Carnivorous Snapvine : vise une unité ennemie sur un champ uniquement', () => {
  const targets = getLegalActions(scenario(), 'a')
    .filter((a) => a.type === 'play-unit' && a.cardId === 'vine')
    .map((a) => (a.type === 'play-unit' ? a.onPlayTargetId : null));
  expect(new Set(targets)).toEqual(new Set(['enemy']));
});

it('Carnivorous Snapvine et sa cible s’infligent leur Might', () => {
  const base = scenario();
  base.units[1]!.might = 4;
  const s = resolveTop(
    step(base, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'vine',
      onPlayTargetId: 'enemy',
      payment: { energyRunes: [], powerRunes: [] },
    }),
  );
  expect(s.units.find((u) => u.id === 'vine')).toMatchObject({ damage: 4 });
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
});

it('Carnivorous Snapvine retirée avant la résolution : aucun dégât', () => {
  const s = step(scenario(), {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'vine',
    onPlayTargetId: 'enemy',
    payment: { energyRunes: [], powerRunes: [] },
  });
  s.units = s.units.filter((u) => u.id !== 'vine');
  expect(resolveTop(s).units.find((u) => u.id === 'enemy')!.damage).toBe(0);
});
