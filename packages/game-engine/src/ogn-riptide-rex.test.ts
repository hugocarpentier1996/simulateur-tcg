import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { riptideRex, flash } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(flash);
  s.unitDefinitions = [riptideRex];
  s.cards.push({
    id: 'rex',
    definitionId: riptideRex.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 6, power: { bleu: 2 } };
  s.units.push({ ...s.units[1]!, id: 'home-enemy', zoneId: 'base-b' });
  return s;
}

it('Riptide Rex : ne peut viser qu’une unité ennemie sur un champ', () => {
  const targets = getLegalActions(scenario(), 'a')
    .filter((a) => a.type === 'play-unit' && a.cardId === 'rex')
    .map((a) => (a.type === 'play-unit' ? a.onPlayTargetId : null));
  expect(new Set(targets)).toEqual(new Set(['enemy']));
});

it('Riptide Rex : 6 dégâts de capacité à la cible après réactions', () => {
  let s = scenario();
  s.units[1]!.might = 8;
  s = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'rex',
    onPlayTargetId: 'enemy',
    payment: { energyRunes: [], powerRunes: [] },
  });
  expect(s.units.find((u) => u.id === 'enemy')!.damage).toBe(0);
  s = resolveTop(s);
  expect(s.units.find((u) => u.id === 'enemy')!.damage).toBe(6);
});
