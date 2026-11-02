import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import {
  reaversRow,
  stupefy,
  travelingMerchant,
} from '../../game-data/src/index.js';

it('Reaver’s Row : quand son contrôleur y défend, il peut renvoyer une unité alliée d’ici en base', () => {
  let s = spellScenario(stupefy);
  s.battlefieldDefinitions = [reaversRow];
  s.battlefields[1]!.definitionId = reaversRow.id;
  s.units.push({ ...s.units[1]!, id: 'enemy2' });
  s.units[0] = { ...s.units[0]!, zoneId: 'base-a', might: 9 };
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
  const top = s.stack?.entries.at(-1);
  expect(top).toMatchObject({
    kind: 'mode-choice',
    ownerId: 'b',
    retreatFrom: 'g',
  });
  s = resolveTop(s);
  expect(s.pendingModeChoice?.modes).toEqual([
    'skip',
    'retreat:enemy',
    'retreat:enemy2',
  ]);
  s = step(s, { type: 'choose-mode', playerId: 'b', mode: 'retreat:enemy2' });
  expect(s.units.find((u) => u.id === 'enemy2')?.zoneId).toBe('base-b');
});

it('Reaver’s Row : ce renvoi en base est un déplacement (déclenche les effets de mouvement)', () => {
  let s = spellScenario(stupefy);
  s.battlefieldDefinitions = [reaversRow];
  s.unitDefinitions = [travelingMerchant];
  s.battlefields[1]!.definitionId = reaversRow.id;
  s.units.push({
    ...s.units[1]!,
    id: 'merchant',
    definitionId: travelingMerchant.id,
  });
  s.units[0] = { ...s.units[0]!, zoneId: 'base-a', might: 9 };
  s = step(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
  s = resolveTop(s);
  s = step(s, { type: 'choose-mode', playerId: 'b', mode: 'retreat:merchant' });
  expect(s.units.find((u) => u.id === 'merchant')?.zoneId).toBe('base-b');
  expect(s.stack?.entries.at(-1)).toMatchObject({
    kind: 'movement',
    sourceId: 'merchant',
  });
});
