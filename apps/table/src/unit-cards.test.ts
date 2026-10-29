import { expect, it } from 'vitest';
import { createDemo, boardOptions, playOrMove } from './session.js';
import { renderTable } from './view.js';
it('expose le retour à la base et rend une vraie carte Tap avec sa Might courante', () => {
  let s = createDemo(true);
  const field = s.state.battlefields[0]!.zoneId;
  s.state.units = [
    {
      id: 'u',
      definitionId: 'ogn-210-298',
      ownerId: 'a',
      zoneId: field,
      ready: true,
      might: 2,
      damage: 0,
      temporaryEffects: [{ type: 'modify-might', amount: 2 }],
    },
  ];
  s.state.battlefields[0]!.controllerId = 'a';
  expect(
    boardOptions(s.state, 'u').some((a) => a.destinationId === 'zone:a:base'),
  ).toBe(true);
  s = playOrMove(s, 'u', 'zone:a:base');
  expect(s.error).toBeNull();
  const html = renderTable(s, null);
  expect(html).toContain('class="unit-card tapped"');
  expect(html).toContain('class="unit-might">4</span>');
  expect(html).not.toContain('dégât(s)</small>');
  expect(html).toContain('aria-label="Daring Poro');
});
