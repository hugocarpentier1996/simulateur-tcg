import { expect, it } from 'vitest';
import {
  spellScenario,
  resolveTop,
  passUntilChoice,
  step,
} from './origins-test-fixtures.js';
import { startTurn } from './turn/progression.js';
import { navoriFightingPit, gust } from '../../game-data/src/index.js';

it('Navori Fighting Pit : tenir ce champ buffe une unité alliée ici', () => {
  const s0 = spellScenario(gust);
  s0.battlefieldDefinitions = [navoriFightingPit];
  s0.battlefields[0]!.definitionId = navoriFightingPit.id;
  let s = startTurn(s0).state;
  s = resolveTop(s);
  expect(s.units.find((u) => u.id === 'ally')?.buffed).toBe(true);
});

it('Navori Fighting Pit : avec plusieurs alliées ici, le joueur choisit laquelle buffer', () => {
  const s0 = spellScenario(gust);
  s0.battlefieldDefinitions = [navoriFightingPit];
  s0.battlefields[0]!.definitionId = navoriFightingPit.id;
  s0.units.push(
    { ...s0.units[0]!, id: 'ally2' },
    { ...s0.units[0]!, id: 'home', zoneId: 'base-a' },
  );
  let s = passUntilChoice(startTurn(s0).state);
  expect(s.pendingModeChoice?.modes).toEqual(['buff:ally', 'buff:ally2']);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'buff:ally2' });
  expect(s.units.filter((u) => u.buffed).map((u) => u.id)).toEqual(['ally2']);
});
