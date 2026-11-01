import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { tideturner, stupefy } from '../../game-data/src/index.js';
import { startNextTurn } from './turn/progression.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [tideturner];
  s.units.push({ ...s.units[0]!, id: 'far', zoneId: 'base-a' });
  s.cards.push({
    id: 'tide',
    definitionId: tideturner.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 2, power: { violet: 1 } };
  return s;
}

it('Tideturner : joué, il échange sa place avec une unité alliée', () => {
  const s = resolveTop(
    step(scenario(), {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'tide',
      destinationId: 'f',
      onPlayTargetId: 'far',
      payment: noRunes,
    }),
  );
  expect(s.units.find((u) => u.id === 'tide')?.zoneId).toBe('base-a');
  expect(s.units.find((u) => u.id === 'far')?.zoneId).toBe('f');
});

it('Tideturner : depuis Hidden, il peut viser une alliée hors de son champ', () => {
  let s = step(scenario(), {
    type: 'hide-card',
    playerId: 'a',
    cardId: 'tide',
    battlefieldId: 'f',
    payment: noRunes,
  });
  s = startNextTurn(startNextTurn(s).state).state;
  s = resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'tide',
      onPlayTargetId: 'far',
      payment: noRunes,
    }),
  );
  expect(s.units.find((u) => u.id === 'tide')?.zoneId).toBe('base-a');
  expect(s.units.find((u) => u.id === 'far')?.zoneId).toBe('f');
});
