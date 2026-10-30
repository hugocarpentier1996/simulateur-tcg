import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createDemo } from './session.js';
import { renderTable } from './view.js';

it('demande la confirmation d’une nouvelle partie dans la page', () => {
  const html = renderTable(createDemo(true), null, [], 'reset');
  expect(html).toContain('La partie actuelle sera effacée');
  expect(html).toContain('data-action="confirm-reset"');
  expect(html).toContain('data-action="cancel-reset"');
  expect(html).toContain('Nouvelle partie BO1');
});

it('précise le format BO3 lors de la confirmation', () => {
  const html = renderTable(createDemo(true), null, [], 'bo3');
  expect(html).toContain('data-action="confirm-reset"');
  expect(html).toContain('manche d’essai BO3');
});

it('n’affiche aucune confirmation sans demande', () => {
  expect(renderTable(createDemo(true), null)).not.toContain('confirm-reset');
});

it('n’utilise plus de boîte de dialogue native bloquante', () => {
  const main = readFileSync(new URL('./main.ts', import.meta.url), 'utf8');
  expect(main).not.toContain('window.confirm');
});
