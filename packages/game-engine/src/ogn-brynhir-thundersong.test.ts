import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import { brynhirThundersong, hextechRay } from '../../game-data/src/index.js';

it('Brynhir Thundersong : les adversaires ne peuvent plus jouer de carte ce tour', () => {
  let s = spellScenario(hextechRay);
  s.unitDefinitions = [brynhirThundersong];
  s.spellDefinitions = [hextechRay];
  s.cards.push(
    {
      id: 'bryn',
      definitionId: brynhirThundersong.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    },
    {
      id: 'ray-b',
      definitionId: hextechRay.id,
      ownerId: 'b',
      zoneId: 'hand-b',
    },
  );
  s.resources.a = { energy: 7, power: { rouge: 1 } };
  s.resources.b = { energy: 1, power: { rouge: 1 } };
  s = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'bryn',
    payment: noRunes,
  });
  s = resolveTop(s);
  expect(s.playLockedPlayers).toEqual(['b']);
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  });
  const react = act(s, {
    type: 'cast-spell',
    playerId: 'b',
    cardId: 'ray-b',
    targetId: 'ally',
    payment: noRunes,
  });
  expect(react).toMatchObject({ ok: false, reason: 'PLAY_LOCKED' });
  s = resolveTop(s);
  s = step(s, { type: 'end-turn', playerId: 'a' });
  expect(s.playLockedPlayers ?? []).toEqual([]);
});
