import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { vayne, stupefy } from '../../game-data/src/index.js';
import { unitConquerEntries } from './effects/unit-conquer.js';
import { resolveModeChoice } from './effects/mode-choice.js';

function scenario(opponentControls: boolean) {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [vayne];
  s.cards.push({
    id: 'vayne',
    definitionId: vayne.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 4, power: { rouge: 1 } };
  if (!opponentControls)
    s.battlefields[1] = { ...s.battlefields[1]!, controllerId: null };
  return s;
}
const play = {
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'vayne',
  payment: noRunes,
};

it('Vayne : entre Ready si un adversaire contrôle un champ', () => {
  expect(
    step(scenario(true), play).units.find((u) => u.id === 'vayne')?.ready,
  ).toBe(true);
  expect(
    step(scenario(false), play).units.find((u) => u.id === 'vayne')?.ready,
  ).toBe(false);
  expect(vayne.assault).toBe(3);
});

it('Vayne : à la conquête, payer 1 énergie la renvoie dans la main', () => {
  let s = step(scenario(true), play);
  s = {
    ...s,
    units: s.units.map((u) => (u.id === 'vayne' ? { ...u, zoneId: 'f' } : u)),
    resources: { ...s.resources, a: { energy: 1, power: {} } },
    stack: {
      entries: [],
      initiatorId: 'a',
      priorityPlayerId: 'a',
      consecutivePasses: 0,
    },
  };
  const [entry] = unitConquerEntries(s, 'a', 'f');
  const pending = resolveModeChoice(s, entry as never).state;
  expect(pending.pendingModeChoice?.modes).toEqual(['skip', 'pay-return']);
  const after = step(pending, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'pay-return',
  });
  expect(after.units.some((u) => u.id === 'vayne')).toBe(false);
  expect(after.cards.find((c) => c.id === 'vayne')?.zoneId).toBe('hand-a');
  expect(after.resources.a?.energy).toBe(0);
  const broke = {
    ...s,
    resources: { ...s.resources, a: { energy: 0, power: {} } },
  };
  expect(
    resolveModeChoice(broke, entry as never).state.pendingModeChoice ?? null,
  ).toBeNull();
});
