import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import { blastconeFae, stupefy } from '../../game-data/src/index.js';
import { effectiveMight } from './effects/modifiers.js';
import { startNextTurn } from './turn/progression.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [blastconeFae];
  s.units = s.units.map((u) => ({ ...u, might: 4 }));
  s.cards.push({
    id: 'fae',
    definitionId: blastconeFae.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 2, power: { bleu: 1 } };
  return s;
}
const play = (onPlayTargetId: string) => ({
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'fae',
  onPlayTargetId,
  payment: noRunes,
});

it('Blastcone Fae : à la mise en jeu, -2 Might à une unité (minimum 1)', () => {
  const after = resolveTop(step(scenario(), play('enemy')));
  expect(
    effectiveMight(
      after.units.find((u) => u.id === 'enemy')!,
      after,
    ),
  ).toBe(2);
});

it('Blastcone Fae : jouée depuis Hidden, elle ne vise qu’une unité de son champ', () => {
  let s = step(scenario(), {
    type: 'hide-card',
    playerId: 'a',
    cardId: 'fae',
    battlefieldId: 'f',
    payment: noRunes,
  });
  s = startNextTurn(startNextTurn(s).state).state;
  expect(act(s, play('enemy')).ok).toBe(false);
  expect(act(s, play('ally')).ok).toBe(true);
});
