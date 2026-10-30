import { tableActions, endTurn, autoEndRunes } from './session.js';
import { renderTable } from './view.js';
import { expect, it } from 'vitest';
import {
  starterConfig,
  createStarterSession,
  starterChampions,
} from './starter-session.js';
import { createGame } from '../../../packages/game-engine/src/index.js';
import { cardInfo } from './catalogue.js';
it('choisit des decks complets et retire le champion approprié avant la pioche', () => {
  const legends = new Set<string>();
  const champions = new Set<string>();
  for (let seed = 1; seed <= 32; seed++) {
    const config = starterConfig(seed);
    expect(config).toEqual(starterConfig(seed));
    for (const p of config.players) {
      legends.add(p.legend.definitionId);
      champions.add(p.champion.definitionId);
      expect(p.deck).toHaveLength(39);
      expect(p.runes).toHaveLength(12);
      expect(p.battlefields).toHaveLength(1);
      const tags = cardInfo(p.champion.definitionId)!.tags!;
      expect(
        starterChampions.some((c) => c.id === p.champion.definitionId),
      ).toBe(true);
      expect(
        tags.some((t) => cardInfo(p.legend.definitionId)!.tags?.includes(t)),
      ).toBe(true);
      expect(p.deck.some((c) => c.id === p.champion.id)).toBe(false);
    }
    expect(createGame(config).ok).toBe(true);
  }
  expect(legends.size).toBe(4);
  expect(champions.size).toBe(8);
});
it('mélange avant la distribution, avec une graine explicite reproductible', () => {
  const a = createStarterSession(2026),
    b = createStarterSession(2026),
    c = createStarterSession(2027);
  expect(a).toEqual(b);
  expect(a.state.cards).not.toEqual(c.state.cards);
  expect(a.state.cards.filter((c) => c.zoneId === 'zone:a:hand')).toHaveLength(
    5,
  );
  expect(a.state.cards.filter((c) => c.zoneId === 'zone:b:hand')).toHaveLength(
    4,
  );
  const config = starterConfig(2026);
  expect(
    a.state.cards.filter((c) => c.zoneId === 'zone:a:hand').map((c) => c.id),
  ).toEqual(config.players[0]!.deck.slice(0, 5).map((c) => c.id));
  expect(config.players[0]!.deck.map((c) => c.id)).not.toEqual(
    [...config.players[0]!.deck]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((c) => c.id),
  );
});

it('ne bloque pas la fin du tour avec Dark Child : runes choisies au bouton de fin de tour', () => {
  const s = Array.from({ length: 32 }, (_, i) =>
    createStarterSession((i + 1) * 1234567),
  ).find((s) =>
    s.state.cards.some(
      (c) => c.ownerId === 'a' && c.definitionId === 'ogs-017-024',
    ),
  )!;
  expect(tableActions(s).some((a) => a.type === 'end-turn')).toBe(false);
  expect(renderTable(s, null)).toContain('Auto');
  const ended = endTurn(s, autoEndRunes(s.state, 'a'));
  expect(ended.state.stack).toBeTruthy();
  expect(ended.state.phase).toBe('end');
});
