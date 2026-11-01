import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { act } from './index.js';
import {
  noxusSaboteur,
  pakaaCub,
  hextechRay,
} from '../../game-data/src/index.js';
import { startNextTurn } from './turn/progression.js';

it('Noxus Saboteur : les cartes cachées adverses de son champ ne peuvent pas être jouées', () => {
  let s = spellScenario(hextechRay);
  s.unitDefinitions = [pakaaCub, noxusSaboteur];
  s.cards.push({
    id: 'cub',
    definitionId: pakaaCub.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 0, power: { orange: 1 } };
  s = step(s, {
    type: 'hide-card',
    playerId: 'a',
    cardId: 'cub',
    battlefieldId: 'f',
    payment: noRunes,
  });
  s = startNextTurn(startNextTurn(s).state).state;
  const play = {
    type: 'play-unit' as const,
    playerId: 'a',
    cardId: 'cub',
    payment: noRunes,
  };
  expect(act(s, play).ok).toBe(true);
  s.units.push({
    ...s.units[1]!,
    id: 'saboteur',
    definitionId: noxusSaboteur.id,
    zoneId: 'f',
  });
  expect(act(s, play).ok).toBe(false);
});
