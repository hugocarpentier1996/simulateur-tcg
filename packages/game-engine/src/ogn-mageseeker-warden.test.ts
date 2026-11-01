import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import {
  mageseekerWarden,
  wallop,
  pitRookie,
} from '../../game-data/src/index.js';

function scenario(wardenZone: string) {
  const s = spellScenario(wallop);
  s.unitDefinitions = [mageseekerWarden, pitRookie];
  s.units.push({
    ...s.units[1]!,
    id: 'warden',
    definitionId: mageseekerWarden.id,
    zoneId: wardenZone,
  });
  return s;
}

it('Mageseeker Warden : sur un champ, les adversaires ne jouent leurs unités qu’en base', () => {
  const s = scenario('g');
  s.cards.push({
    id: 'rookie',
    definitionId: pitRookie.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 2, power: {} };
  const play = (destinationId: string) => ({
    type: 'play-unit' as const,
    playerId: 'a',
    cardId: 'rookie',
    destinationId,
    onPlayTargetId: 'ally',
    payment: noRunes,
  });
  expect(act(s, play('f')).ok).toBe(false);
  expect(act(s, play('base-a')).ok).toBe(true);
  const home = scenario('base-b');
  home.cards.push({
    id: 'rookie',
    definitionId: pitRookie.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  home.resources.a = { energy: 2, power: {} };
  expect(act(home, play('f')).ok).toBe(true);
});

it('Mageseeker Warden : sorts et capacités ne redressent pas les unités ennemies', () => {
  let s = scenario('g');
  s.resources.b = { energy: 2, power: {} };
  s.activePlayerId = 'b';
  s.cards[0] = { ...s.cards[0]!, ownerId: 'b', zoneId: 'hand-b' };
  s.units[0] = { ...s.units[0]!, ready: false };
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'b',
      cardId: 'spell',
      targetId: 'ally',
      payment: noRunes,
    }),
  );
  expect(s.units.find((u) => u.id === 'ally')?.ready).toBe(false);
});
