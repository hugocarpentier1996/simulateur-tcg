import { expect, it } from 'vitest';
import { createDemo } from './session.js';
import { renderTable } from './view.js';
it('projette une unité Tap transparente à destination sans changer son état', () => {
  const s = createDemo(true);
  s.state.units = [
    {
      id: 'poro',
      definitionId: 'ogn-210-298',
      ownerId: 'a',
      zoneId: 'zone:a:base',
      ready: true,
      might: 2,
      damage: 0,
    },
  ];
  const html = renderTable(s, null, [
    { unitId: 'poro', destinationId: s.state.battlefields[0]!.zoneId },
  ]);
  expect(html).toContain('data-preview="poro"');
  expect(html).toContain('unit-card tapped move-preview');
  expect(s.state.units[0]!.ready).toBe(true);
  expect(s.state.units[0]!.zoneId).toBe('zone:a:base');
});
it('affiche les domaines et deux pistes de huit cristaux, en miroir', () => {
  const s = createDemo(true);
  s.state.players[0]!.score = 3;
  const html = renderTable(s, null);
  expect(html).toContain('<strong>Body</strong>');
  expect(html).toContain('<strong>Order</strong>');
  expect(html.match(/class="victory-crystal/g)).toHaveLength(16);
  expect(html.match(/victory-crystal earned/g)).toHaveLength(3);
  expect(html).toContain('victory-track opponent');
  expect(html).toContain('victory-track active');
});
it('utilise le même panneau et la même action de priorité dans les deux Showdowns', () => {
  const s = createDemo(true);
  const common = {
    battlefieldId: s.state.battlefields[0]!.zoneId,
    initiatorId: 'a',
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  for (const kind of ['open', 'combat'] as const) {
    s.state.showdown =
      kind === 'open'
        ? { ...common, kind }
        : {
            ...common,
            kind,
            defenderId: 'b',
            stage: 'priority',
            assignments: {},
          };
    const html = renderTable(s, null);
    expect(html).toContain('class="showdown-panel"');
    expect(html).toContain('0 / 2 passes');
    expect(html).toContain('data-choice="0"');
  }
});
