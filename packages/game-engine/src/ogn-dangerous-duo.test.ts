import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { effectiveMight } from './effects/modifiers.js';
import { dangerousDuo, hextechRay } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(hextechRay);
  s.unitDefinitions = [dangerousDuo];
  s.cards.push({
    id: 'duo',
    definitionId: dangerousDuo.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 4, power: { rouge: 1 } };
  return s;
}
const targets = (s: ReturnType<typeof scenario>) =>
  getLegalActions(s, 'a').flatMap((a) =>
    a.type === 'play-unit' && a.cardId === 'duo'
      ? [a.onPlayTargetId ?? '-']
      : [],
  );

it('Dangerous Duo : sans Legion, aucune cible', () => {
  expect(new Set(targets(scenario()))).toEqual(new Set(['-']));
});

it('Dangerous Duo : Legion — +2 Might à une unité ce tour', () => {
  let s = resolveTop(
    step(scenario(), {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(targets(s)).toContain('ally');
  const before = effectiveMight(
    s.units.find((u) => u.id === 'ally')!,
    s,
  );
  s = resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'duo',
      onPlayTargetId: 'ally',
      payment: noRunes,
    }),
  );
  expect(
    effectiveMight(
      s.units.find((u) => u.id === 'ally')!,
      s,
    ),
  ).toBe(before + 2);
});
