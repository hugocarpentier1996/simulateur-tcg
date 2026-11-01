import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import {
  karthus,
  watchfulSentry,
  hextechRay,
} from '../../game-data/src/index.js';

it('Karthus : les effets Deathknell de son propriétaire se déclenchent une fois de plus', () => {
  let s = spellScenario(hextechRay);
  s.unitDefinitions = [karthus, watchfulSentry];
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  s.units[1] = { ...s.units[1]!, definitionId: watchfulSentry.id, might: 1 };
  s.units.push({
    ...s.units[1]!,
    id: 'karthus',
    definitionId: karthus.id,
    zoneId: 'base-b',
    might: 3,
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
  expect(s.pendingDeaths?.triggers).toHaveLength(2);
  s = step(
    s,
    getLegalActions(s, 'b').find((a) => a.type === 'queue-death-effects')!,
  );
  s = resolveTop(resolveTop(s));
  expect(s.cards.filter((c) => c.zoneId === 'hand-b')).toHaveLength(2);
});
