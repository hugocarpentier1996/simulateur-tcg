import { expect, it } from 'vitest';
import { act, getLegalActions } from './index.js';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { hextechRay, poutyPoro } from '../../game-data/src/index.js';

function scenario(allow: boolean) {
  const s = spellScenario(hextechRay);
  s.unitDefinitions = [poutyPoro];
  s.units[1] = { ...s.units[1]!, definitionId: poutyPoro.id, might: 5 };
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  if (allow) s.preferences = { a: { allowDeflectRefusal: true } };
  return s;
}
const cast = (refuseDeflect?: boolean) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'enemy',
  ...(refuseDeflect ? { refuseDeflect } : {}),
  payment: noRunes,
});

it('Deflect : par défaut la taxe est due (impayable ici) et le refus est interdit', () => {
  expect(act(scenario(false), cast()).ok).toBe(false);
  expect(act(scenario(false), cast(true)).ok).toBe(false);
});

it('Deflect refusé (option) : le sort se lance sans la taxe et son effet sur l’unité fizzle', () => {
  const s0 = scenario(true);
  expect(
    getLegalActions(s0, 'a').some(
      (a) =>
        a.type === 'cast-spell' && a.targetId === 'enemy' && a.refuseDeflect,
    ),
  ).toBe(true);
  const s = resolveTop(step(s0, cast(true)));
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(0);
  expect(s.cards.find((c) => c.id === 'spell')?.zoneId).toBe('graveyard-a');
});
