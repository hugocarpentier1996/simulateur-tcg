import { expect, it } from 'vitest';
import { spellScenario, resolveTop } from './origins-test-fixtures.js';
import {
  mushroomPouch,
  hextechRay,
  pakaaCub,
} from '../../game-data/src/index.js';
import { startTurn } from './turn/progression.js';

function scenario(facedown: boolean) {
  const s = spellScenario(hextechRay);
  s.gearDefinitions = [mushroomPouch];
  s.unitDefinitions = [pakaaCub];
  s.gears = [
    {
      id: 'pouch',
      definitionId: mushroomPouch.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  if (facedown)
    s.cards.push({
      id: 'cub',
      definitionId: pakaaCub.id,
      ownerId: 'a',
      zoneId: 'f',
      facedown: { fresh: false },
    });
  return s;
}

it('Mushroom Pouch : au début de la Beginning, avec une carte cachée sur un champ, pioche 1', () => {
  const s = startTurn(scenario(true)).state;
  expect(s.stack?.entries.at(-1)).toMatchObject({
    kind: 'legend-draw',
    sourceId: 'pouch',
  });
  const after = resolveTop(s);
  expect(after.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
});

it('Mushroom Pouch : sans carte cachée, rien', () => {
  const s = startTurn(scenario(false)).state;
  expect(
    s.stack?.entries.some((e) => 'sourceId' in e && e.sourceId === 'pouch') ??
      false,
  ).toBe(false);
});
