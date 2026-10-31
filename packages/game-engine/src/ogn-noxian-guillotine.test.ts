import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { noxianGuillotine, hextechRay } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(noxianGuillotine);
  s.spellDefinitions = [noxianGuillotine, hextechRay];
  s.cards.push({
    id: 'ray',
    definitionId: hextechRay.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 5, power: { rouge: 2 } };
  s.units = s.units.map((u) => ({ ...u, might: 10 }));
  return s;
}
const guillotine = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'enemy',
  payment: noRunes,
};
const ray = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'ray',
  targetId: 'enemy',
  payment: noRunes,
};

it('Noxian Guillotine : la cible meurt la prochaine fois qu’elle subit des dégâts ce tour', () => {
  let s = resolveTop(step(scenario(), guillotine));
  expect(s.units.some((u) => u.id === 'enemy')).toBe(true);
  s = resolveTop(step(s, ray));
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
});

it('Noxian Guillotine : Legion — la cible meurt aussitôt', () => {
  let s = resolveTop(step(scenario(), ray));
  s = resolveTop(step(s, guillotine));
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
});

it('Noxian Guillotine : la marque disparaît en fin de tour', () => {
  let s = resolveTop(step(scenario(), guillotine));
  s = step(s, { type: 'end-turn', playerId: 'a' });
  expect(
    s.units.find((u) => u.id === 'enemy')?.killOnDamageAbove,
  ).toBeUndefined();
});
