import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
  passUntilChoice,
} from './origins-test-fixtures.js';
import { karma, nocturne, stackedDeck } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(stackedDeck);
  s.unitDefinitions = [karma, nocturne];
  s.cards = s.cards.map((c) =>
    c.id === 'draw-a-1' ? { ...c, definitionId: nocturne.id } : c,
  );
  s.units.push({ ...s.units[0]!, id: 'karma', definitionId: karma.id });
  s.resources.a = { energy: 1, power: { violet: 1 } };
  return resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
}

it('Stacked Deck : regarder Nocturne (recyclé) permet de le jouer pour 1 Power ; Karma buffe une fois pour cet effet', () => {
  let s = scenario();
  expect(s.pendingPick?.cardIds).toEqual(['draw-a-0', 'draw-a-1', 'draw-a-2']);
  s = step(s, { type: 'choose-pick', playerId: 'a', cardId: 'draw-a-0' });
  const entries = s.stack?.entries ?? [];
  expect(entries.filter((e) => 'buffChoice' in e)).toHaveLength(1);
  expect(
    entries.some((e) => 'fromDeck' in e && e.sourceId === 'draw-a-1'),
  ).toBe(true);
  s = passUntilChoice(s);
  while (s.pendingModeChoice && !s.pendingModeChoice.modes.includes('pay-play'))
    s = passUntilChoice(
      step(s, {
        type: 'choose-mode',
        playerId: 'a',
        mode: s.pendingModeChoice.modes.at(-1)!,
      }),
    );
  expect(s.pendingModeChoice?.modes).toEqual(['skip', 'pay-play']);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'pay-play' });
  expect(s.units.find((u) => u.id === 'draw-a-1')?.zoneId).toBe('base-a');
});
