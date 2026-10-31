import { expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import * as catalogue from './index.js';
it('raccorde les tags imprimés des unités, sans les confondre avec les capacités', () => {
  expect(catalogue.faithfulManufactor.tags).toEqual(['Piltover']);
  expect(catalogue.tibbers.tags).toEqual(['Annie']);
  expect(catalogue.stalwartPoro.tags).toEqual(['Poro']);
  expect(catalogue.stalwartPoro.tags).not.toContain('Shield');
  expect(catalogue.recruitToken.tags).toEqual(['Recruit']);
});
it('copie et fige les tags sans dépendre du tableau appelant', () => {
  const tags = ['Zaun'];
  const d = catalogue.defineUnit({
    id: 'sample',
    name: 'Sample',
    type: 'unit',
    cost: { energy: 0, power: {} },
    might: 1,
    tags,
  });
  tags.push('Mech');
  expect(d.tags).toEqual(['Zaun']);
  expect(Object.isFrozen(d.tags)).toBe(true);
});
it('chaque carte réelle implémentée possède une image locale présente, jeton inclus', () => {
  const definitions = (Object.values(catalogue) as unknown[]).filter(
    (v): v is { id: string; imageLocal: string } =>
      !!v &&
      typeof v === 'object' &&
      'id' in v &&
      typeof v.id === 'string' &&
      /^(ogs|ogn)-/.test(v.id),
  );
  expect(definitions).toHaveLength(119);
  for (const d of definitions) {
    expect(d.imageLocal, d.id).toMatch(/^\/cards\/[a-z0-9-]+\.png$/);
    expect(existsSync('apps/table/public' + d.imageLocal), d.id).toBe(true);
  }
});

it('distingue les versions de champion par leur sous-titre imprimé', () => {
  expect(catalogue.garenBody.displayName).toBe('Garen, Rugged');
  expect(catalogue.annieFury.displayName).toBe('Annie, Fiery');
});
