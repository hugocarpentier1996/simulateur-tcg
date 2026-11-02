import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
  drain,
} from './origins-test-fixtures.js';
import {
  viktorOrder,
  recruitToken,
  hextechRay,
} from '../../game-data/src/index.js';

function scenario(deadDefinition: string) {
  const s = spellScenario(hextechRay);
  s.unitDefinitions = [viktorOrder, recruitToken];
  s.units.push({
    ...s.units[1]!,
    id: 'viktor',
    definitionId: viktorOrder.id,
    zoneId: 'base-b',
    might: 4,
  });
  s.units[1] = { ...s.units[1]!, might: 1, definitionId: deadDefinition };
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  return drain(
    resolveTop(
      step(s, {
        type: 'cast-spell',
        playerId: 'a',
        cardId: 'spell',
        targetId: 'enemy',
        payment: noRunes,
      }),
    ),
  );
}
const recruits = (s: ReturnType<typeof scenario>) =>
  s.units.filter(
    (u) => u.definitionId === recruitToken.id && u.ownerId === 'b',
  );

it('Viktor (Order) : la mort d’une autre unité alliée non-Recrue joue une Recrue dans la base', () => {
  const s = scenario('x');
  expect(recruits(s).map((u) => u.zoneId)).toEqual(['base-b']);
});

it('Viktor (Order) : pas pour une Recrue', () => {
  expect(recruits(scenario(recruitToken.id))).toHaveLength(0);
});
