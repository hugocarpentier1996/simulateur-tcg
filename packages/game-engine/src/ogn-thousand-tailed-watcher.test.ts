import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { effectiveMight } from './index.js';
import { thousandTailedWatcher, flash } from '../../game-data/src/index.js';

it('Thousand-Tailed Watcher : -3 Might à toutes les unités ennemies jusqu’à la fin du tour, minimum 1', () => {
  let s = spellScenario(flash);
  s.unitDefinitions = [thousandTailedWatcher];
  s.cards.push({
    id: 'ttw',
    definitionId: thousandTailedWatcher.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 7, power: { bleu: 1 } };
  s.units[1]!.might = 6;
  s.units.push({ ...s.units[1]!, id: 'small', might: 2, zoneId: 'base-b' });
  s = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'ttw',
    payment: { energyRunes: [], powerRunes: [] },
  });
  s = resolveTop(s);
  const might = (id: string) =>
    effectiveMight(
      s.units.find((u) => u.id === id)!,
      s,
    );
  expect([might('enemy'), might('small'), might('ally'), might('ttw')]).toEqual(
    [3, 1, 3, 7],
  );
  s = step(s, { type: 'end-turn', playerId: 'a' });
  expect(might('enemy')).toBe(6);
});
