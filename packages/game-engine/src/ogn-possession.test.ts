import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import { possession, hextechRay } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(possession);
  s.resources.a = { energy: 8, power: { violet: 3 } };
  return s;
}
const cast = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'enemy',
  payment: noRunes,
};

it('Possession : prend le contrôle d’une unité ennemie d’un champ et la rappelle dans sa base', () => {
  const s = resolveTop(step(scenario(), cast));
  expect(s.units.find((u) => u.id === 'enemy')).toMatchObject({
    ownerId: 'a',
    cardOwnerId: 'b',
    zoneId: 'base-a',
  });
  expect(s.battlefields.find((f) => f.zoneId === 'g')?.controllerId).toBeNull();
});

it('Possession : l’unité volée qui meurt va au cimetière de son propriétaire', () => {
  const s = resolveTop(step(scenario(), cast));
  s.spellDefinitions = [possession, hextechRay];
  s.cards.push({
    id: 'ray',
    definitionId: hextechRay.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  s.units = s.units.map((u) =>
    u.id === 'enemy' ? { ...u, zoneId: 'f', might: 2 } : u,
  );
  const after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'ray',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(after.cards.find((c) => c.id === 'enemy')).toMatchObject({
    ownerId: 'b',
    zoneId: 'graveyard-b',
  });
});

it('Possession : seulement une unité ennemie sur un champ', () => {
  const s = scenario();
  s.units[1] = { ...s.units[1]!, zoneId: 'base-b' };
  expect(act(s, cast).ok).toBe(false);
});
