import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import { skySplitter } from '../../game-data/src/index.js';

const cast = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'enemy',
  payment: noRunes,
};
function scenario(energy: number) {
  const s = spellScenario(skySplitter);
  s.resources.a = { energy, power: { rouge: 1 } };
  s.units = s.units.map((u) =>
    u.id === 'ally' ? { ...u, might: 5 } : { ...u, might: 9 },
  );
  return s;
}

it('Sky Splitter : énergie réduite de la plus haute Might alliée, puis 5 dégâts', () => {
  expect(act(scenario(2), cast).ok).toBe(false);
  const s = resolveTop(step(scenario(3), cast));
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(5);
  expect(s.resources.a?.energy).toBe(0);
});
