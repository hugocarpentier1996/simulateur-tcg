import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { act } from './index.js';
import {
  missFortuneChaos,
  pitRookie,
  mobilize,
} from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [missFortuneChaos, pitRookie];
  s.units = s.units.filter((u) => u.zoneId !== 'g');
  s.battlefields[1]!.controllerId = null;
  s.cards[0]!.definitionId = pitRookie.id;
  s.resources.a = { energy: 10, power: { violet: 1 } };
  return s;
}
const play = {
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'spell',
  destinationId: 'g',
  onPlayTargetId: 'ally',
  payment: noRunes,
};

it('Miss Fortune (Chaos) : les unités alliées peuvent être jouées sur un champ libre', () => {
  expect(act(scenario(), play).ok).toBe(false);
  const s = scenario();
  s.units.push({
    ...s.units[0]!,
    id: 'mf',
    definitionId: missFortuneChaos.id,
    zoneId: 'base-a',
  });
  expect(step(s, play).units.find((u) => u.id === 'spell')?.zoneId).toBe('g');
  expect(missFortuneChaos.canPlayToOpenBattlefield).toBe(true);
});
