import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import {
  machineEvangel,
  hextechRay,
  recruitToken,
} from '../../game-data/src/index.js';

it('Machine Evangel : Deathknell, trois Recrues de 1 Might Tap dans la base du propriétaire', () => {
  let s = spellScenario(hextechRay);
  s.unitDefinitions = [machineEvangel, recruitToken];
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  s.units[1] = { ...s.units[1]!, definitionId: machineEvangel.id, might: 2 };
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
  const tokens = s.units.filter((u) => u.token);
  expect(tokens).toHaveLength(3);
  expect(
    tokens.every(
      (u) => u.zoneId === 'base-b' && u.ownerId === 'b' && u.might === 1,
    ),
  ).toBe(true);
});
