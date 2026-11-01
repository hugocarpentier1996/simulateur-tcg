import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import { bountyHunter, mobilize } from '../../game-data/src/index.js';

it('Bounty Hunter : Tap — une unité gagne Ganking ce tour', () => {
  let s = spellScenario(mobilize);
  s.legendDefinitions = [bountyHunter];
  s.zones.push({ id: 'legend-a', kind: 'legend', ownerId: 'a' });
  s.cards.push({
    id: 'hunter',
    definitionId: bountyHunter.id,
    ownerId: 'a',
    zoneId: 'legend-a',
    ready: true,
  });
  s.units = s.units.filter((u) => u.id !== 'enemy');
  s.battlefields = s.battlefields.map((f) => ({ ...f, controllerId: 'a' }));
  const gank = {
    type: 'move' as const,
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  };
  expect(act(s, gank).ok).toBe(false);
  s = resolveTop(
    step(s, {
      type: 'activate-gear',
      playerId: 'a',
      gearId: 'hunter',
      targetId: 'ally',
      payment: noRunes,
    }),
  );
  expect(act(s, gank).ok).toBe(true);
});
