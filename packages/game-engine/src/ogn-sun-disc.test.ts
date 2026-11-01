import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { sunDisc, pakaaCub, stupefy } from '../../game-data/src/index.js';

function scenario(played: number) {
  const s = spellScenario(stupefy);
  s.gearDefinitions = [sunDisc];
  s.unitDefinitions = [pakaaCub];
  s.gears = [
    {
      id: 'disc',
      definitionId: sunDisc.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  s.cards.push(
    { id: 'c1', definitionId: pakaaCub.id, ownerId: 'a', zoneId: 'hand-a' },
    { id: 'c2', definitionId: pakaaCub.id, ownerId: 'a', zoneId: 'hand-a' },
  );
  s.cardsPlayedThisTurn = { a: played };
  s.resources.a = { energy: 6, power: {} };
  return resolveTop(
    step(s, {
      type: 'activate-gear',
      playerId: 'a',
      gearId: 'disc',
      payment: noRunes,
    }),
  );
}
const play = (cardId: string) => ({
  type: 'play-unit' as const,
  playerId: 'a',
  cardId,
  payment: noRunes,
});

it('Sun Disc : Legion — la prochaine unité jouée ce tour arrive Ready', () => {
  let s = step(scenario(1), play('c1'));
  expect(s.units.find((u) => u.id === 'c1')?.ready).toBe(true);
  s = step(s, play('c2'));
  expect(s.units.find((u) => u.id === 'c2')?.ready).toBe(false);
});

it('Sun Disc : sans autre carte jouée ce tour, aucun effet', () => {
  const s = step(scenario(0), play('c1'));
  expect(s.units.find((u) => u.id === 'c1')?.ready).toBe(false);
});
