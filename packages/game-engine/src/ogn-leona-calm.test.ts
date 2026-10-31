import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { leonaCalm, mobilize } from '../../game-data/src/index.js';

function scenario(opponentScore: number) {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [leonaCalm];
  s.cards[0]!.definitionId = leonaCalm.id;
  s.resources.a = { energy: 6, power: { vert: 1 } };
  s.players = s.players.map((p) =>
    p.id === 'b' ? { ...p, score: opponentScore } : p,
  );
  return s;
}
const play = {
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'spell',
  destinationId: 'g',
  payment: noRunes,
};

it('Leona : entre Ready si un adversaire est à 3 points de la victoire', () => {
  {
    const s = scenario(4);
    s.battlefields[1]!.controllerId = 'a';
    expect(step(s, play).units.find((u) => u.id === 'spell')?.ready).toBe(
      false,
    );
  }
  const s = scenario(5);
  s.battlefields[1]!.controllerId = 'a';
  expect(step(s, play).units.find((u) => u.id === 'spell')?.ready).toBe(true);
});

it('Leona : les ennemis Stun de sa zone ont -8 Might, minimum 1', () => {
  const s = scenario(0);
  s.units.push({
    ...s.units[0]!,
    id: 'leona',
    definitionId: leonaCalm.id,
    zoneId: 'g',
  });
  s.units[1] = {
    ...s.units[1]!,
    might: 10,
    temporaryEffects: [{ type: 'stun' }],
  };
  expect(effectiveMight(s.units[1]!, s)).toBe(2);
  s.units[1] = { ...s.units[1]!, might: 5 };
  expect(effectiveMight(s.units[1]!, s)).toBe(1);
  s.units[1] = { ...s.units[1]!, temporaryEffects: [] };
  expect(effectiveMight(s.units[1]!, s)).toBe(5);
});
