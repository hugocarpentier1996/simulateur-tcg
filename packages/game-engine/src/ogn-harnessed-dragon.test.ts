import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { harnessedDragon, flash } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(flash);
  s.unitDefinitions = [harnessedDragon];
  s.cards.push({
    id: 'dragon',
    definitionId: harnessedDragon.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 8, power: { jaune: 2 } };
  s.units[1]!.zoneId = 'base-b';
  s.units[1]!.might = 20;
  return s;
}

it('Harnessed Dragon : tue une unité ennemie quelconque, base comprise', () => {
  const targets = getLegalActions(scenario(), 'a')
    .filter((a) => a.type === 'play-unit' && a.cardId === 'dragon')
    .map((a) => (a.type === 'play-unit' ? a.onPlayTargetId : null));
  expect(new Set(targets)).toEqual(new Set(['enemy']));
  const s = resolveTop(
    step(scenario(), {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'dragon',
      onPlayTargetId: 'enemy',
      payment: { energyRunes: [], powerRunes: [] },
    }),
  );
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(s.units.find((u) => u.id === 'dragon')).toMatchObject({ might: 6 });
});

it('Harnessed Dragon se joue sans effet quand aucune unité ennemie n’existe', () => {
  const base = scenario();
  base.units = base.units.filter((u) => u.id !== 'enemy');
  const s = resolveTop(
    step(base, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'dragon',
      payment: { energyRunes: [], powerRunes: [] },
    }),
  );
  expect(s.units.map((u) => u.id).sort()).toEqual(['ally', 'dragon']);
});
