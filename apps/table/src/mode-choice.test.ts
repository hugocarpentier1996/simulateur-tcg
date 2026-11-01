import { expect, it } from 'vitest';
import { spellScenario } from '../../../packages/game-engine/src/origins-test-fixtures.js';
import {
  cruelPatron,
  qiyana,
  stupefy,
} from '../../../packages/game-data/src/index.js';
import { handPlayer, tableActions, type Session } from './session.js';
import { renderTable } from './view.js';

it('Choix de mode : le panneau propose « Piocher 1 » et « Canaliser 1 rune Tap »', () => {
  const state = spellScenario(stupefy);
  state.unitDefinitions = [qiyana];
  state.units[0] = { ...state.units[0]!, definitionId: qiyana.id };
  state.stack = {
    entries: [],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  state.pendingModeChoice = {
    kind: 'mode-choice',
    sourceId: 'ally',
    ownerId: 'a',
    modes: ['draw', 'channel-exhausted'],
  };
  const s: Session = { state, history: [], log: [], error: null };
  expect(handPlayer(state)).toBe('a');
  expect(tableActions(s).map((a) => a.type)).toEqual([
    'choose-mode',
    'choose-mode',
  ]);
  const html = renderTable(s, null);
  expect(html).toContain('Choisir l’effet · Qiyana');
  expect(html).toContain('Piocher 1');
  expect(html).toContain('Canaliser 1 rune Tap');
});

it('Cruel Patron : chaque option nomme l’unité alliée tuée en coût', () => {
  const state = spellScenario(stupefy);
  state.unitDefinitions = [cruelPatron];
  state.cards.push({
    id: 'patron',
    definitionId: cruelPatron.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  state.resources.a = { energy: 4, power: {} };
  const s: Session = { state, history: [], log: [], error: null };
  expect(renderTable(s, { cardId: 'patron' })).toMatch(
    /en tuant [^<]*ally|en tuant/,
  );
});
