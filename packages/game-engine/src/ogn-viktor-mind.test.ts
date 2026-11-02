import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  noRunes,
  drain,
} from './origins-test-fixtures.js';
import {
  viktorMind,
  recruitToken,
  stupefy,
} from '../../game-data/src/index.js';

function scenario(active: string) {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [viktorMind, recruitToken];
  s.units.push({
    ...s.units[0]!,
    id: 'viktor',
    definitionId: viktorMind.id,
    zoneId: 'base-a',
  });
  s.resources.a = { energy: 1, power: {} };
  s.activePlayerId = active;
  if (active === 'b')
    s.stack = {
      entries: [{ kind: 'legend-draw', sourceId: 'x', ownerId: 'b', count: 0 }],
      initiatorId: 'b',
      priorityPlayerId: 'a',
      consecutivePasses: 0,
    };
  return drain(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
}
const recruits = (s: ReturnType<typeof scenario>) =>
  s.units.filter((u) => u.definitionId === recruitToken.id);

it('Viktor (Mind) : jouer une carte pendant le tour adverse joue une Recrue dans la base', () => {
  expect(recruits(scenario('b')).map((u) => u.zoneId)).toEqual(['base-a']);
});

it('Viktor (Mind) : rien pendant son propre tour', () => {
  expect(recruits(scenario('a'))).toHaveLength(0);
});
