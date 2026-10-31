import { expect, it } from 'vitest';
import { spellScenario, step } from './origins-test-fixtures.js';
import { blazingScorcher, flash } from '../../game-data/src/index.js';

it.each([
  [false, 5, 0, false],
  [true, 6, 1, true],
])(
  'Blazing Scorcher : Accelerate %s -> coût %i énergie et %i Fury, Ready %s',
  (accelerate, energy, fury, ready) => {
    const s = spellScenario(flash);
    s.unitDefinitions = [blazingScorcher];
    s.cards.push({
      id: 'bs',
      definitionId: blazingScorcher.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    });
    s.resources.a = { energy, power: { rouge: fury } };
    const next = step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'bs',
      payment: { energyRunes: [], powerRunes: [] },
      ...(accelerate ? { accelerate: true } : {}),
    });
    expect(next.units.find((u) => u.id === 'bs')).toMatchObject({
      ready,
      might: 5,
    });
    expect(next.resources.a!.energy).toBe(0);
  },
);
