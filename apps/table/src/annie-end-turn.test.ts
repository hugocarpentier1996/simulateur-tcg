import { expect, it } from 'vitest';
import {
  autoEndRunes,
  endTurn,
  endTurnRuneChoice,
  tableActions,
  type Session,
} from './session.js';
import { createStarterSession } from './starter-session.js';
import { renderTable } from './view.js';

/** Partie de démonstration où le Joueur 1 joue Dark Child, avec une rune Tap. */
function annieSession(): Session {
  const s = Array.from({ length: 32 }, (_, i) =>
    createStarterSession((i + 1) * 1234567),
  ).find((s) =>
    s.state.cards.some(
      (c) => c.ownerId === 'a' && c.definitionId === 'ogs-017-024',
    ),
  )!;
  const [first] = s.state.cards.filter(
    (c) => c.ownerId === 'a' && c.zoneId === 'zone:a:runes',
  );
  return {
    ...s,
    state: {
      ...s.state,
      cards: s.state.cards.map((c) =>
        c.id === first!.id ? { ...c, ready: false } : c,
      ),
    },
  };
}

it('garde le bouton de fin de tour actif et retire le choix annexe du panneau', () => {
  const s = annieSession();
  expect(endTurnRuneChoice(s.state, 'a')?.count).toBe(2);
  expect(tableActions(s).some((a) => a.type === 'end-turn')).toBe(false);
  const html = renderTable(s, null);
  expect(html).not.toMatch(/data-action="end" disabled/);
  expect(html).toContain('data-action="toggle-auto-runes"');
});

it('redresse les deux runes cliquées en terminant le tour', () => {
  const s = annieSession();
  const choice = endTurnRuneChoice(s.state, 'a')!;
  const picked = choice.runeIds.slice(0, 2);
  const html = renderTable(s, null, [], null, { endRunes: [picked[0]!] });
  expect(html).toContain(`data-rune="${picked[0]}"`);
  expect(html).toContain('1 / 2 runes');
  expect(endTurn(s, [picked[0]!]).error).toMatch(/2 rune/);
  const ended = endTurn(s, picked);
  expect(ended.error).toBeNull();
  expect(ended.state.phase).toBe('end');
  expect(ended.state.stack?.entries).toHaveLength(1);
});

it('choisit automatiquement les runes Tap en priorité', () => {
  const s = annieSession();
  const tapped = s.state.cards.find(
    (c) => c.ownerId === 'a' && c.zoneId === 'zone:a:runes' && !c.ready,
  )!;
  const auto = autoEndRunes(s.state, 'a');
  expect(auto).toHaveLength(2);
  expect(auto[0]).toBe(tapped.id);
  expect(endTurn(s, auto).error).toBeNull();
  expect(renderTable(s, null, [], null, { autoRunes: { a: true } })).toContain(
    'aria-pressed="true"',
  );
});

it('termine normalement le tour d’une légende sans effet de fin de tour', () => {
  const s = Array.from({ length: 32 }, (_, i) =>
    createStarterSession((i + 1) * 7654321),
  ).find(
    (s) =>
      !s.state.cards.some(
        (c) => c.ownerId === 'a' && c.definitionId === 'ogs-017-024',
      ),
  )!;
  expect(endTurnRuneChoice(s.state, 'a')).toBeNull();
  expect(endTurn(s).state.activePlayerId).toBe('b');
});
