import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { consultThePast } from '../../game-data/src/index.js';
import { startNextTurn } from './turn/progression.js';

const cast = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'a',
  payment: noRunes,
};

it('Consult the Past : Réaction, pioche 2', () => {
  const s = spellScenario(consultThePast);
  s.resources.a = { energy: 4, power: {} };
  const after = resolveTop(step(s, cast));
  expect(after.cards.filter((c) => c.zoneId === 'hand-a')).toHaveLength(2);
});

it('Consult the Past : caché, il se joue gratuitement au tour suivant', () => {
  let s = spellScenario(consultThePast);
  s.resources.a = { energy: 0, power: { bleu: 1 } };
  s = step(s, {
    type: 'hide-card',
    playerId: 'a',
    cardId: 'spell',
    battlefieldId: 'f',
    payment: noRunes,
  });
  s = startNextTurn(startNextTurn(s).state).state;
  s.resources.a = { energy: 0, power: {} };
  const after = resolveTop(step(s, cast));
  expect(after.cards.find((c) => c.id === 'spell')?.zoneId).toBe('graveyard-a');
  expect(after.cards.find((c) => c.id === 'spell')?.facedown).toBeUndefined();
});
