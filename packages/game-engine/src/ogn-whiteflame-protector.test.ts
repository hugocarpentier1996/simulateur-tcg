import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { act, effectiveMight, getLegalActions } from './index.js';
import { whiteflameProtector, flash } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(flash);
  s.unitDefinitions = [whiteflameProtector];
  s.cards.push({
    id: 'wp',
    definitionId: whiteflameProtector.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 8, power: { vert: 2 } };
  return s;
}
const play = (onPlayTargetId?: string) => ({
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'wp',
  payment: { energyRunes: [], powerRunes: [] },
  ...(onPlayTargetId ? { onPlayTargetId } : {}),
});

it('Whiteflame Protector : la cible choisie à la mise en jeu gagne +8 Might après réactions', () => {
  let s = step(scenario(), play('enemy'));
  expect(s.stack!.entries).toHaveLength(1);
  expect(
    effectiveMight(
      s.units.find((u) => u.id === 'enemy')!,
      s,
    ),
  ).toBe(3);
  s = resolveTop(s);
  expect(
    effectiveMight(
      s.units.find((u) => u.id === 'enemy')!,
      s,
    ),
  ).toBe(11);
  s = step(s, { type: 'end-turn', playerId: 'a' });
  expect(
    effectiveMight(
      s.units.find((u) => u.id === 'enemy')!,
      s,
    ),
  ).toBe(3);
});

it('Whiteflame Protector peut se cibler lui-même ; la cible est obligatoire', () => {
  const s = scenario();
  const targets = getLegalActions(s, 'a')
    .filter((a) => a.type === 'play-unit' && a.cardId === 'wp')
    .map((a) => (a.type === 'play-unit' ? a.onPlayTargetId : null));
  expect(new Set(targets)).toEqual(new Set(['ally', 'enemy', 'wp']));
  expect(act(s, play()).ok).toBe(false);
  const self = resolveTop(step(s, play('wp')));
  expect(
    effectiveMight(
      self.units.find((u) => u.id === 'wp')!,
      self,
    ),
  ).toBe(16);
});

it('Whiteflame Protector sans effet si la cible a disparu avant la résolution', () => {
  const s = step(scenario(), play('enemy'));
  s.units = s.units.filter((u) => u.id !== 'enemy');
  const next = resolveTop(s);
  expect(next.stack).toBeNull();
});
