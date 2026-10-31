import { expect, it } from 'vitest';
import { spellScenario, step } from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { legionRearguard, flash } from '../../game-data/src/index.js';

function scenario(energy: number, fury: number) {
  const s = spellScenario(flash);
  s.unitDefinitions = [legionRearguard];
  s.cards.push({
    id: 'lr',
    definitionId: legionRearguard.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy, power: { rouge: fury } };
  return s;
}
const play = (accelerate: boolean) => ({
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'lr',
  payment: { energyRunes: [], powerRunes: [] },
  ...(accelerate ? { accelerate: true } : {}),
});

it('Legion Rearguard : sans Accelerate, 2 énergie et arrivée Tap', () => {
  const s = step(scenario(2, 0), play(false));
  expect(s.units.find((u) => u.id === 'lr')).toMatchObject({
    ready: false,
    might: 2,
  });
});

it('Legion Rearguard : Accelerate coûte 1 énergie et 1 Fury de plus, arrivée Ready', () => {
  const s = step(scenario(3, 1), play(true));
  expect(s.units.find((u) => u.id === 'lr')!.ready).toBe(true);
  expect(s.resources.a).toMatchObject({ energy: 0, power: { rouge: 0 } });
  expect(act(scenario(2, 1), play(true)).ok).toBe(false);
  expect(act(scenario(3, 0), play(true)).ok).toBe(false);
});

it('les actions légales proposent Accelerate seulement s’il est payable', () => {
  const variants = (energy: number, fury: number) =>
    new Set(
      getLegalActions(scenario(energy, fury), 'a')
        .filter((a) => a.type === 'play-unit' && a.cardId === 'lr')
        .map((a) => (a.type === 'play-unit' ? !!a.accelerate : null)),
    );
  expect(variants(3, 1)).toEqual(new Set([false, true]));
  expect(variants(2, 0)).toEqual(new Set([false]));
});

it('Accelerate est refusé pour une unité qui ne l’a pas', () => {
  const s = scenario(3, 1);
  const { accelerate: _accelerate, ...plain } = legionRearguard;
  expect(_accelerate).toEqual({ power: 'rouge' });
  s.unitDefinitions = [plain];
  expect(act(s, play(true))).toMatchObject({ ok: false });
});
