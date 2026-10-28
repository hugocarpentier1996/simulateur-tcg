import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { gust, recruitToken } from '../../game-data/src/index.js';
import { noxianDrummer } from '../../game-data/src/index.js';
function setup() {
  const s = spellScenario(gust);
  return {
    ...s,
    unitDefinitions: [noxianDrummer, recruitToken],
    units: s.units.map((u) =>
      u.id === 'ally'
        ? { ...u, definitionId: noxianDrummer.id, zoneId: 'base-a' }
        : u,
    ),
  };
}
it.each([false, true])(
  'Noxian Drummer invoque ici malgré le contrôle ennemi et la disparition de sa source : %s',
  (removed) => {
    let s = step(setup(), {
      type: 'move',
      playerId: 'a',
      unitId: 'ally',
      destinationId: 'g',
    });
    expect(s.stack?.entries).toHaveLength(1);
    expect(s.units.some((u) => u.token)).toBe(false);
    if (removed) {
      s = step(s, {
        type: 'cast-spell',
        playerId: 'a',
        cardId: 'spell',
        targetId: 'ally',
        payment: noRunes,
      });
      s = resolveTop(s);
      expect(s.units.some((u) => u.id === 'ally')).toBe(false);
      expect(s.stack?.entries).toHaveLength(1);
    }
    s = resolveTop(s);
    expect(s.units.find((u) => u.token)).toMatchObject({
      ownerId: 'a',
      zoneId: 'g',
      might: 1,
      ready: false,
    });
    expect(s.battlefields.find((f) => f.zoneId === 'g')?.controllerId).toBe(
      'b',
    );
    expect(s.players[0]!.score).toBe(0);
  },
);
it('la mise en jeu ne compte pas comme un déplacement', () => {
  const s = setup();
  s.cards.push({
    id: 'new',
    definitionId: noxianDrummer.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  const next = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'new',
    destinationId: 'f',
    payment: noRunes,
  });
  expect(next.stack).toBeUndefined();
  expect(next.units.some((u) => u.token)).toBe(false);
});
