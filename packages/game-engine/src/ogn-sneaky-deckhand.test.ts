import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { stupefy } from '../../game-data/src/index.js';
import { act } from './act.js';
import { getLegalActions } from './legal/actions.js';
import { sneakyDeckhand } from '../../game-data/src/index.js';
function setup() {
  const s = spellScenario(stupefy);
  return {
    ...s,
    unitDefinitions: [sneakyDeckhand],
    cards: [
      ...s.cards,
      {
        id: 'sneaky',
        definitionId: sneakyDeckhand.id,
        ownerId: 'a',
        zoneId: 'hand-a',
      },
    ],
  };
}
const play = {
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'sneaky',
  payment: noRunes,
};
it('Sneaky Deckhand peut être joué sur un champ entièrement vide ; conquête après les passes', () => {
  let s = setup();
  s = {
    ...s,
    units: s.units.filter((u) => u.zoneId !== 'g'),
    battlefields: s.battlefields.map((f) =>
      f.zoneId === 'g' ? { ...f, controllerId: null } : f,
    ),
  };
  expect(getLegalActions(s, 'a')).toContainEqual({
    ...play,
    destinationId: 'g',
  });
  let next = step(s, { ...play, destinationId: 'g' });
  expect(next.showdown?.kind).toBe('open');
  expect(next.players[0]!.score).toBe(0);
  expect(next.units.find((u) => u.id === 'sneaky')).toMatchObject({
    zoneId: 'g',
    ready: false,
    might: 2,
  });
  next = step(next, { type: 'pass', playerId: 'a' });
  next = step(next, { type: 'pass', playerId: 'b' });
  expect(next.players[0]!.score).toBe(1);
});
it('conserve les destinations normales sans autoriser le champ adverse occupé ou la base adverse', () => {
  const s = setup();
  for (const destinationId of ['base-a', 'f'])
    expect(act(s, { ...play, destinationId }).ok).toBe(true);
  for (const destinationId of ['base-b', 'g'])
    expect(act(s, { ...play, destinationId })).toEqual({
      ok: false,
      reason: 'INVALID_SUMMON_DESTINATION',
    });
});
