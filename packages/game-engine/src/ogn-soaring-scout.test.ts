import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { soaringScout, hextechRay } from '../../game-data/src/index.js';

it('Soaring Scout : Deathknell, son propriétaire canalise 1 rune Tap', () => {
  let s = spellScenario(hextechRay);
  s.unitDefinitions = [soaringScout];
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  s.units[1] = { ...s.units[1]!, definitionId: soaringScout.id, might: 1 };
  s.cards.push({
    id: 'rune-b',
    definitionId: 'rune',
    ownerId: 'b',
    zoneId: 'rune-pile-b',
    color: 'jaune',
  });
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  s = step(
    s,
    getLegalActions(s, 'b').find((a) => a.type === 'queue-death-effects')!,
  );
  s = resolveTop(s);
  expect(s.cards.find((c) => c.id === 'rune-b')).toMatchObject({
    zoneId: 'runes-b',
    ready: false,
  });
});
