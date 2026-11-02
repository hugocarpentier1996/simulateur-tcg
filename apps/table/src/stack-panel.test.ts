import { expect, it } from 'vitest';
import { spellScenario } from '../../../packages/game-engine/src/origins-test-fixtures.js';
import { act } from '../../../packages/game-engine/src/index.js';
import { hextechRay, windWall } from '../../../packages/game-data/src/index.js';
import { reactionPopup, stackPanel, stackTopKey } from './view.js';
import type { Session } from './session.js';

function cast() {
  const s = spellScenario(hextechRay);
  s.spellDefinitions = [hextechRay, windWall];
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  const r = act(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: { energyRunes: [], powerRunes: [] },
  });
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}

it('Pile : toujours affichée, vide ou avec le sommet en premier', () => {
  const empty = spellScenario(hextechRay);
  expect(stackPanel(empty)).toContain('vide');
  expect(stackTopKey(empty)).toBeNull();
  const state = cast();
  const html = stackPanel(state);
  expect(html).toContain('Sommet');
  expect(html).toContain('Joueur 1');
  expect(stackTopKey(state)).not.toBeNull();
});

it('Fenêtre de réaction : nom de la carte au sommet et bouton pour passer', () => {
  const state = cast();
  const session: Session = { state, log: [], error: null, history: [] };
  const html = reactionPopup(session);
  expect(html).toContain('Nouvelle carte sur la pile');
  expect(html).toContain('data-action="reaction-pass"');
  expect(html).toContain('data-action="reaction-hide"');
});
