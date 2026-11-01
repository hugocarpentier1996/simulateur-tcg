import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { buffUnit } from './effects/buff.js';
import { wallop } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(wallop);
  s.resources.a = { energy: 0, power: {} };
  s.units[0] = { ...s.units[0]!, ready: false };
  return s;
}

it('Wallop : redresse une unité ; dépenser un buff allié remplace tout le coût', () => {
  const plain = {
    type: 'cast-spell' as const,
    playerId: 'a',
    cardId: 'spell',
    targetId: 'ally',
    payment: noRunes,
  };
  expect(act(scenario(), plain).ok).toBe(false);
  const buffed = buffUnit(scenario(), 'ally');
  const free = getLegalActions(buffed, 'a').find(
    (a) => a.type === 'cast-spell' && a.spendBuffUnitId === 'ally',
  );
  expect(free).toBeDefined();
  const s = resolveTop(step(buffed, { ...plain, spendBuffUnitId: 'ally' }));
  expect(s.units[0]).toMatchObject({ ready: true });
  expect(s.units[0]?.buffed).toBeUndefined();
});

it('Wallop : le buff dépensé doit être celui d’une unité alliée', () => {
  const s = buffUnit(scenario(), 'enemy');
  expect(
    act(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'ally',
      spendBuffUnitId: 'enemy',
      payment: noRunes,
    }).ok,
  ).toBe(false);
});
