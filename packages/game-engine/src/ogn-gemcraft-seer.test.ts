import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { gemcraftSeer, pakaaCub, stupefy } from '../../game-data/src/index.js';

function scenario(withSeer: boolean) {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [gemcraftSeer, pakaaCub];
  if (withSeer) s.units[0] = { ...s.units[0]!, definitionId: gemcraftSeer.id };
  s.cards.push({
    id: 'cub',
    definitionId: pakaaCub.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 3, power: {} };
  return step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'cub',
    payment: noRunes,
  });
}

it('Gemcraft Seer : les autres unités alliées jouées ont Vision', () => {
  const after = resolveTop(scenario(true));
  expect(after.pendingVision).toMatchObject({ playerId: 'a', sourceId: 'cub' });
  expect(scenario(false).stack ?? null).toBeNull();
  expect(gemcraftSeer.onPlayVision).toBe(true);
});
