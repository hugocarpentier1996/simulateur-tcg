import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { portalRescue, pakaaCub } from '../../game-data/src/index.js';

it('Portal Rescue : bannit une unité alliée puis la rejoue dans sa base, état remis à neuf', () => {
  const s = spellScenario(portalRescue);
  s.zones.push({ id: 'banished-a', kind: 'banished', ownerId: 'a' });
  s.resources.a = { energy: 3, power: { bleu: 1 } };
  s.unitDefinitions = [pakaaCub];
  s.units[0] = {
    ...s.units[0]!,
    definitionId: pakaaCub.id,
    damage: 2,
    buffed: true,
    might: 5,
  };
  const after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'ally',
      payment: noRunes,
    }),
  );
  const unit = after.units.find((u) => u.id === 'ally');
  expect(unit).toMatchObject({
    zoneId: 'base-a',
    damage: 0,
    ready: false,
    might: 3,
  });
  expect(unit?.buffed).toBeUndefined();
  expect(after.cards.some((c) => c.id === 'ally')).toBe(false);
});
