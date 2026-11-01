import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { zenithBlade } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(zenithBlade);
  s.resources.a = { energy: 3, power: { vert: 1, jaune: 1 } };
  s.units[0] = { ...s.units[0]!, zoneId: 'base-a', ready: false };
  return s;
}
const cast = (secondaryTargetId?: string) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'enemy',
  ...(secondaryTargetId ? { secondaryTargetId } : {}),
  payment: noRunes,
});

it('Zenith Blade : étourdit l’ennemi et peut déplacer un allié sur son champ', () => {
  const s = resolveTop(step(scenario(), cast('ally')));
  expect(s.units.find((u) => u.id === 'enemy')?.temporaryEffects).toEqual([
    { type: 'stun', byPlayerId: 'a' },
  ]);
  expect(s.units.find((u) => u.id === 'ally')?.zoneId).toBe('g');
  const alone = resolveTop(step(scenario(), cast()));
  expect(alone.units.find((u) => u.id === 'ally')?.zoneId).toBe('base-a');
});

it('Zenith Blade : le déplacement ne concerne qu’une unité alliée', () => {
  expect(act(scenario(), cast('enemy')).ok).toBe(false);
  const options = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'cast-spell'
      ? [`${a.targetId}:${a.secondaryTargetId ?? '-'}`]
      : [],
  );
  expect(new Set(options)).toEqual(new Set(['enemy:-', 'enemy:ally']));
});
