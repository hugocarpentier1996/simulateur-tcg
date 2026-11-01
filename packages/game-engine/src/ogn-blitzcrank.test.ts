import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { startTurn } from './turn/progression.js';
import { blitzcrank, mobilize } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [blitzcrank];
  s.cards[0]!.definitionId = blitzcrank.id;
  s.resources.a = { energy: 5, power: { vert: 1 } };
  return s;
}

it('Blitzcrank : joué sur un champ, peut y attirer une unité ennemie', () => {
  const choices = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'play-unit' && a.destinationId === 'f'
      ? [a.onPlayTargetId ?? '-']
      : [],
  );
  expect(new Set(choices)).toEqual(new Set(['-', 'enemy']));
  const inBase = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'play-unit' && a.destinationId === 'base-a'
      ? [a.onPlayTargetId ?? '-']
      : [],
  );
  expect(inBase).toEqual(['-']);
  const s = resolveTop(
    step(scenario(), {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      destinationId: 'f',
      onPlayTargetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(s.units.find((u) => u.id === 'enemy')?.zoneId).toBe('f');
});

it('Blitzcrank : quand il tient, il retourne dans la main de son propriétaire', () => {
  const s0 = scenario();
  s0.units[0] = { ...s0.units[0]!, id: 'blitz', definitionId: blitzcrank.id };
  let s = startTurn(s0).state;
  s = resolveTop(s);
  expect(s.units.some((u) => u.id === 'blitz')).toBe(false);
  expect(s.cards.find((c) => c.id === 'blitz')?.zoneId).toBe('hand-a');
});
