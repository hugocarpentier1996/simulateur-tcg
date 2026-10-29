import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { disintegrate } from '../../game-data/src/index.js';
it.each(['kill', 'survive', 'recall', 'token', 'left'] as const)(
  'Disintegrate pioche seulement si ses dégâts tuent : %s',
  (mode) => {
    let s = spellScenario(disintegrate);
    if (mode === 'survive') s.units[1]!.might = 4;
    if (mode === 'recall')
      s.units[1]!.temporaryEffects = [{ type: 'recall-on-death' }];
    if (mode === 'token') s.units[1]!.token = true;
    s = step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    });
    if (mode === 'left')
      s = {
        ...s,
        units: s.units.map((u) =>
          u.id === 'enemy' ? { ...u, zoneId: 'base-b' } : u,
        ),
      };
    s = resolveTop(s);
    expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe(
      mode === 'kill' || mode === 'token' ? 'hand-a' : 'deck-a',
    );
    if (mode === 'left') expect(s.units[1]!.damage).toBe(0);
    if (mode === 'recall') expect(s.units[1]!.zoneId).toBe('base-b');
  },
);
