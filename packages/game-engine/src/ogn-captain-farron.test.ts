import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { effectiveMight, type GameState } from './index.js';
import { captainFarron, flash } from '../../game-data/src/index.js';

function combat(attackerId: string): GameState {
  const s = spellScenario(flash);
  s.unitDefinitions = [captainFarron];
  s.units = [
    {
      ...s.units[0]!,
      id: 'farron',
      definitionId: captainFarron.id,
      might: 5,
      zoneId: 'g',
    },
    { ...s.units[0]!, id: 'friend', might: 2, zoneId: 'g' },
    { ...s.units[0]!, id: 'away', might: 2, zoneId: 'f' },
    { ...s.units[1]!, zoneId: 'g' },
  ];
  s.showdown = {
    kind: 'combat',
    battlefieldId: 'g',
    initiatorId: attackerId,
    defenderId: attackerId === 'a' ? 'b' : 'a',
    participants: ['a', 'b'],
    priorityPlayerId: attackerId,
    consecutivePasses: 0,
    stage: 'priority',
    assignments: {},
  };
  return s;
}
const might = (s: GameState, id: string) =>
  effectiveMight(
    s.units.find((u) => u.id === id)!,
    s,
  );

it('Captain Farron : les autres unités alliées ici ont Assault (+1 en attaque)', () => {
  const s = combat('a');
  expect([might(s, 'farron'), might(s, 'friend'), might(s, 'away')]).toEqual([
    5, 3, 2,
  ]);
});

it('Captain Farron : aucun bonus en défense', () => {
  const s = combat('b');
  expect(might(s, 'friend')).toBe(2);
});
