import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { solariShrine, hextechRay } from '../../game-data/src/index.js';

function scenario(stunned: boolean) {
  const s = spellScenario(hextechRay);
  s.gearDefinitions = [solariShrine];
  s.gears = [
    {
      id: 'shrine',
      definitionId: solariShrine.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  s.units[1] = {
    ...s.units[1]!,
    might: 2,
    ...(stunned ? { temporaryEffects: [{ type: 'stun' as const }] } : {}),
  };
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  return resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
}

it('Solari Shrine : tuer un ennemi Stun couche le gear et fait piocher 1', () => {
  const s = scenario(true);
  expect(s.gears?.[0]?.ready).toBe(false);
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
});

it('Solari Shrine : rien pour un ennemi non Stun', () => {
  const s = scenario(false);
  expect(s.gears?.[0]?.ready).toBe(true);
});
