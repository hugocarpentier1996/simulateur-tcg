import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { lastBreath, deadbloomPredator } from '../../game-data/src/index.js';

const cast = (secondaryTargetId: string) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'ally',
  secondaryTargetId,
  payment: noRunes,
});
function scenario() {
  const s = spellScenario(lastBreath);
  s.resources.a = { energy: 3, power: { vert: 1, violet: 1 } };
  s.units[0] = { ...s.units[0]!, ready: false, might: 5, zoneId: 'base-a' };
  s.units.push({ ...s.units[1]!, id: 'home-enemy', zoneId: 'base-b' });
  return s;
}

it('Last Breath : redresse l’unité alliée, qui inflige sa Might à l’ennemi choisi sans en subir', () => {
  const s = resolveTop(step(scenario(), cast('enemy')));
  expect(s.units.find((u) => u.id === 'ally')).toMatchObject({
    ready: true,
    damage: 0,
  });
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
});

it('Last Breath : l’ennemi doit être sur un champ', () => {
  const s = scenario();
  expect(act(s, cast('home-enemy')).ok).toBe(false);
  const enemies = getLegalActions(s, 'a')
    .filter((a) => a.type === 'cast-spell')
    .map((a) => (a.type === 'cast-spell' ? a.secondaryTargetId : null));
  expect(new Set(enemies)).toEqual(new Set(['enemy']));
});

it('Last Breath : deux symboles hybrides, payables en Calm et/ou Chaos', () => {
  const s = scenario();
  s.resources.a = { energy: 3, power: { violet: 2 } };
  expect(act(s, cast('enemy')).ok).toBe(true);
  s.resources.a = { energy: 3, power: { vert: 1, rouge: 1 } };
  expect(act(s, cast('enemy')).ok).toBe(false);
});

it('Last Breath : choisir un ennemi Deflect comme seconde cible coûte 1 Power de plus', () => {
  const s = scenario();
  s.unitDefinitions = [deadbloomPredator];
  s.units[1] = { ...s.units[1]!, definitionId: deadbloomPredator.id };
  expect(act(s, cast('enemy')).ok).toBe(false);
  s.resources.a = { energy: 3, power: { vert: 1, violet: 2 } };
  expect(act(s, cast('enemy')).ok).toBe(true);
});
