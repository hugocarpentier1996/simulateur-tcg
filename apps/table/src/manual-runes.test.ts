import { expect, it } from 'vitest';
import { useRune } from './session.js';
import { createStarterSession } from './starter-session.js';
import { renderTable } from './view.js';

const runesOf = (s: ReturnType<typeof createStarterSession>, id: string) =>
  s.state.cards.filter((c) => c.zoneId === `zone:${id}:runes`);

it('Tap une rune au clic : +1 énergie dans la réserve et ligne de journal', () => {
  const s = createStarterSession(42);
  const [rune] = runesOf(s, 'a');
  const next = useRune(s, rune!.id, 'tap');
  expect(next.error).toBeNull();
  expect(next.state.resources.a!.energy).toBe(1);
  expect(next.history).toHaveLength(1);
  expect(next.log.at(-1)).toMatch(/Tap une rune : \+1 énergie/);
  expect(renderTable(next, null)).toContain('<b>1</b> énergie');
});

it('recycle une rune Ready au clic droit : énergie et Power de sa couleur', () => {
  const s = createStarterSession(42);
  const [rune] = runesOf(s, 'a');
  const next = useRune(s, rune!.id, 'recycle');
  expect(next.state.resources.a!.energy).toBe(1);
  expect(next.state.resources.a!.power[rune!.color!]).toBe(1);
  expect(runesOf(next, 'a')).toHaveLength(runesOf(s, 'a').length - 1);
  expect(next.log.at(-1)).toMatch(/recycle une rune/);
});

it('refuse une rune adverse sans priorité, avec un message', () => {
  const s = createStarterSession(42);
  const [rune] = runesOf(s, 'b');
  expect(rune).toBeUndefined();
  const [own] = runesOf(s, 'a');
  const tapped = useRune(useRune(s, own!.id, 'tap'), own!.id, 'tap');
  expect(tapped.error).toMatch(/Tap/);
  expect(renderTable(s, null)).toContain(`data-rune="${own!.id}"`);
});
