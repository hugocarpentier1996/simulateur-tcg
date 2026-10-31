import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { effectiveMight, type GameState } from './index.js';
import { taric, flash } from '../../game-data/src/index.js';

function defending(): GameState {
  const s = spellScenario(flash);
  s.unitDefinitions = [taric];
  s.units = [
    {
      ...s.units[0]!,
      id: 'taric',
      definitionId: taric.id,
      might: 4,
      zoneId: 'f',
      tank: true,
    },
    { ...s.units[0]!, id: 'friend', might: 2, zoneId: 'f' },
    { ...s.units[1]!, zoneId: 'f' },
  ];
  s.showdown = {
    kind: 'combat',
    battlefieldId: 'f',
    initiatorId: 'b',
    defenderId: 'a',
    participants: ['a', 'b'],
    priorityPlayerId: 'b',
    consecutivePasses: 0,
    stage: 'priority',
    assignments: {},
  };
  return s;
}

it('Taric : Shield pour lui et pour les autres unités alliées ici en défense', () => {
  const s = defending();
  const might = (id: string) =>
    effectiveMight(
      s.units.find((u) => u.id === id)!,
      s,
    );
  expect([might('taric'), might('friend')]).toEqual([5, 3]);
});

it('Taric arrive avec Tank', () => {
  expect(taric).toMatchObject({ tank: true, shield: 1, might: 4 });
});
