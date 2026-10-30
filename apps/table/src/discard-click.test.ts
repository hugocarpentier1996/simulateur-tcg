import { expect, it } from 'vitest';
import { spellScenario } from '../../../packages/game-engine/src/origins-test-fixtures.js';
import { flash } from '../../../packages/game-data/src/index.js';
import { discardFromHand, type Session } from './session.js';
import { renderTable } from './view.js';

/** Fenêtre de défausse de Traveling Merchant ouverte pour le Joueur 1. */
function discarding(): Session {
  const state = spellScenario(flash);
  state.pendingDiscard = { playerId: 'a', sourceId: 'ally' };
  state.stack = {
    entries: [],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  return { state, history: [], log: [], error: null };
}

it('surligne les cartes de la main à défausser et explique le clic', () => {
  const html = renderTable(discarding(), null);
  expect(html).toContain('discard-choice');
  expect(html).toContain('Clique la carte de ta main à défausser');
});

it('défausse la carte cliquée puis reprend la résolution', () => {
  const s = discarding();
  const next = discardFromHand(s, 'spell');
  expect(next.error).toBeNull();
  expect(next.state.pendingDiscard).toBeFalsy();
  expect(next.state.cards.find((c) => c.id === 'spell')!.zoneId).toBe(
    'graveyard-a',
  );
  expect(next.log.join('\n')).toMatch(/Joueur 1 défausse/);
});

it('refuse une carte hors de la main du joueur qui défausse', () => {
  const s = discarding();
  const next = discardFromHand(s, 'draw-a-0');
  expect(next.state).toBe(s.state);
  expect(next.error).toBeTruthy();
});
