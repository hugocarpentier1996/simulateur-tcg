import { expect, it } from 'vitest';
import { createDemo, setPreference, undo } from './session.js';
import { optionsPanel, PREFERENCE_OPTIONS } from './view.js';

it('Options : une case par joueur et par préférence, cochée selon l’état', () => {
  let session = createDemo();
  const html = optionsPanel(session.state);
  expect(html.match(/data-pref=/g)).toHaveLength(PREFERENCE_OPTIONS.length * 2);
  session = setPreference(session, 'b', 'autoPassReactions', true);
  expect(session.state.preferences?.b?.autoPassReactions).toBe(true);
  expect(optionsPanel(session.state)).toMatch(
    /data-pref="autoPassReactions" data-player="b"[^>]*checked/,
  );
  expect(session.history).toHaveLength(0);
  expect(undo(session)).toBe(session);
});
