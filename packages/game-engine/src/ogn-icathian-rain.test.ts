import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { icathianRain } from '../../game-data/src/index.js';

const cast = (selectedUnitIds: string[]) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'a',
  selectedUnitIds,
  payment: noRunes,
});

function scenario(power: Record<string, number>) {
  const s0 = spellScenario(icathianRain);
  s0.units = s0.units.map((u) => ({ ...u, might: 20 }));
  s0.resources.a = { energy: 7, power };
  return s0;
}

it('Icathian Rain : six fois 2 dégâts, les six cibles choisies au lancement (répétitions permises)', () => {
  const s = resolveTop(
    step(
      scenario({ rouge: 2, bleu: 1 }),
      cast(['enemy', 'enemy', 'enemy', 'enemy', 'ally', 'ally']),
    ),
  );
  expect(s.pendingModeChoice ?? null).toBeNull();
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(8);
  expect(s.units.find((u) => u.id === 'ally')?.damage).toBe(4);
});

it('Icathian Rain : 3 Power répartis au choix entre Fury et Mind ; il faut exactement six cibles', () => {
  for (const power of [{ rouge: 3 }, { bleu: 3 }, { rouge: 1, bleu: 2 }])
    expect(act(scenario(power), cast(Array(6).fill('enemy'))).ok).toBe(true);
  expect(act(scenario({ orange: 3 }), cast(Array(6).fill('enemy'))).ok).toBe(
    false,
  );
  expect(act(scenario({ rouge: 3 }), cast(Array(5).fill('enemy'))).ok).toBe(
    false,
  );
  expect(
    getLegalActions(scenario({ rouge: 3 }), 'a').filter(
      (a) => a.type === 'cast-spell',
    ),
  ).toHaveLength(2);
});
