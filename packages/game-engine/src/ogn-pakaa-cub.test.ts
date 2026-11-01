import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { pakaaCub, hextechRay } from '../../game-data/src/index.js';
import { startNextTurn } from './turn/progression.js';
import type { GameState } from './types.js';

function scenario() {
  const s = spellScenario(hextechRay);
  s.unitDefinitions = [pakaaCub];
  s.cards.push({
    id: 'cub',
    definitionId: pakaaCub.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 0, power: { orange: 1 } };
  return s;
}
const hide = (battlefieldId: string) => ({
  type: 'hide-card' as const,
  playerId: 'a',
  cardId: 'cub',
  battlefieldId,
  payment: noRunes,
});
const playCub = {
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'cub',
  payment: noRunes,
};
/** Deux fins de tour : retour au tour de a, carte cachée devenue jouable. */
const nextOwnTurn = (s: GameState) =>
  startNextTurn(startNextTurn(s).state).state;

it('Hidden : cacher coûte 1 Power, sur un champ contrôlé et libre', () => {
  expect(act(scenario(), hide('g')).ok).toBe(false);
  const s = step(scenario(), hide('f'));
  expect(s.cards.find((c) => c.id === 'cub')).toMatchObject({
    zoneId: 'f',
    facedown: { fresh: true },
  });
  expect(s.resources.a?.power.orange ?? 0).toBe(0);
  const again = {
    ...s,
    resources: { ...s.resources, a: { energy: 0, power: { orange: 1 } } },
  };
  again.cards = [
    ...again.cards,
    { id: 'cub2', definitionId: pakaaCub.id, ownerId: 'a', zoneId: 'hand-a' },
  ];
  expect(act(again, { ...hide('f'), cardId: 'cub2' }).ok).toBe(false);
  expect(
    getLegalActions(scenario(), 'a').filter((a) => a.type === 'hide-card'),
  ).toEqual([hide('f')]);
});

it('Hidden : jouable gratuitement à partir du tour suivant, sur son champ', () => {
  const hidden = step(scenario(), hide('f'));
  expect(act(hidden, playCub).ok).toBe(false);
  const later = nextOwnTurn(hidden);
  later.resources.a = { energy: 0, power: {} };
  expect(act(later, { ...playCub, destinationId: 'base-a' }).ok).toBe(false);
  const played = step(later, playCub);
  expect(played.units.find((u) => u.id === 'cub')?.zoneId).toBe('f');
  expect(played.cards.some((c) => c.id === 'cub')).toBe(false);
});

it('Hidden : à vitesse Réaction pendant le tour adverse, la pile est conservée', () => {
  let s = startNextTurn(step(scenario(), hide('f'))).state;
  s.resources.b = { energy: 1, power: { rouge: 1 } };
  s.cards.push({
    id: 'ray',
    definitionId: hextechRay.id,
    ownerId: 'b',
    zoneId: 'hand-b',
  });
  s = step(s, {
    type: 'cast-spell',
    playerId: 'b',
    cardId: 'ray',
    targetId: 'ally',
    payment: noRunes,
  });
  s = step(s, { type: 'pass', playerId: 'b' });
  expect(s.stack?.priorityPlayerId).toBe('a');
  const played = step(s, playCub);
  expect(played.units.find((u) => u.id === 'cub')?.zoneId).toBe('f');
  expect(played.stack?.entries).toHaveLength(1);
});

it('Hidden : le champ perdu met la carte cachée au cimetière', () => {
  const s = step(scenario(), hide('f'));
  s.battlefields[0] = { ...s.battlefields[0]!, controllerId: 'b' };
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  const after = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  });
  expect(after.cards.find((c) => c.id === 'cub')).toMatchObject({
    zoneId: 'graveyard-a',
  });
  expect(after.cards.find((c) => c.id === 'cub')?.facedown).toBeUndefined();
});
