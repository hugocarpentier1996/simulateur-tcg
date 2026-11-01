import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import {
  relentlessStorm,
  jeweledColossus,
  pitRookie,
  mobilize,
} from '../../game-data/src/index.js';

function scenario(definitionId: string) {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [jeweledColossus, pitRookie];
  s.legendDefinitions = [relentlessStorm];
  s.zones.push({ id: 'legend-a', kind: 'legend', ownerId: 'a' });
  s.cards.push(
    {
      id: 'storm',
      definitionId: relentlessStorm.id,
      ownerId: 'a',
      zoneId: 'legend-a',
      ready: true,
    },
    {
      id: 'rune',
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'rune-pile-a',
      color: 'rouge',
    },
  );
  s.cards[0]!.definitionId = definitionId;
  s.resources.a = { energy: 5, power: {} };
  return s;
}

it('Relentless Storm : jouer une unité Mighty couche la légende et canalise 1 rune Tap', () => {
  let s = step(scenario(jeweledColossus.id), {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'spell',
    payment: noRunes,
  });
  expect(s.cards.find((c) => c.id === 'storm')?.ready).toBe(false);
  while (s.stack || s.pendingVision)
    s = s.pendingVision
      ? step(s, { type: 'choose-vision', playerId: 'a', recycle: false })
      : step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId });
  expect(s.cards.find((c) => c.id === 'rune')).toMatchObject({
    zoneId: 'runes-a',
    ready: false,
  });
});

it('Relentless Storm : rien pour une unité non Mighty', () => {
  const s = step(scenario(pitRookie.id), {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'spell',
    onPlayTargetId: 'ally',
    payment: noRunes,
  });
  expect(s.cards.find((c) => c.id === 'storm')?.ready).toBe(true);
});

it('Relentless Storm : Mighty est mesuré sur la Might réelle (aura comprise)', () => {
  const four = { ...jeweledColossus, id: 'four', might: 4 };
  const aura = { ...pitRookie, id: 'aura', otherAlliesHereMightBonus: 1 };
  const s0 = scenario(four.id);
  s0.unitDefinitions = [four, aura];
  s0.units.push({
    id: 'booster',
    definitionId: aura.id,
    ownerId: 'a',
    zoneId: 'base-a',
    ready: true,
    might: 2,
    damage: 0,
  });
  const s = step(s0, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'spell',
    payment: noRunes,
  });
  expect(s.cards.find((c) => c.id === 'storm')?.ready).toBe(false);
});
