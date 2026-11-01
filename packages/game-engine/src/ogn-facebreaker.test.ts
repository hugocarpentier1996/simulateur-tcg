import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { facebreaker } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(facebreaker);
  s.resources.a = { energy: 2, power: {} };
  s.units.push({ ...s.units[1]!, id: 'enemy-f', zoneId: 'f' });
  return s;
}
const cast = (targetId: string, secondaryTargetId: string) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId,
  secondaryTargetId,
  payment: noRunes,
});

it('Facebreaker : étourdit une unité alliée et une unité ennemie du même champ', () => {
  const s = resolveTop(step(scenario(), cast('ally', 'enemy-f')));
  for (const id of ['ally', 'enemy-f'])
    expect(s.units.find((u) => u.id === id)?.temporaryEffects).toEqual([
      { type: 'stun' },
    ]);
});

it('Facebreaker : l’ennemie doit être sur le champ de l’alliée', () => {
  expect(act(scenario(), cast('ally', 'enemy')).ok).toBe(false);
  expect(act(scenario(), cast('enemy-f', 'ally')).ok).toBe(false);
  const pairs = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'cast-spell' ? [`${a.targetId}+${a.secondaryTargetId}`] : [],
  );
  expect(pairs).toEqual(['ally+enemy-f']);
});
