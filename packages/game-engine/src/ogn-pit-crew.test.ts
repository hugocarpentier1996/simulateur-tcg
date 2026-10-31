import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { pitCrew, sealOfRage, mobilize } from '../../game-data/src/index.js';

it('Pit Crew : se redresse quand son propriétaire joue un gear', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [pitCrew];
  s.gearDefinitions = [sealOfRage];
  s.units[0] = { ...s.units[0]!, definitionId: pitCrew.id, ready: false };
  s.units[1] = { ...s.units[1]!, definitionId: pitCrew.id, ready: false };
  s.cards.push({
    id: 'seal',
    definitionId: sealOfRage.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 0, power: { rouge: 1 } };
  s = step(s, {
    type: 'play-gear',
    playerId: 'a',
    cardId: 'seal',
    payment: noRunes,
  });
  expect(s.units.find((u) => u.id === 'ally')?.ready).toBe(true);
  expect(s.units.find((u) => u.id === 'enemy')?.ready).toBe(false);
});
