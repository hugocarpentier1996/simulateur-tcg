import { expect, it } from 'vitest';
import { zoomImage, zoomPosition } from './zoom.js';

/** Mini-DOM : juste ce que zoomImage utilise (closest, querySelector, contains…). */
class Node {
  children: Node[] = [];
  parentElement: Node | null = null;
  classList: { contains: (c: string) => boolean };
  constructor(
    public tagName: string,
    public classes: string[] = [],
    public attrs: Record<string, string> = {},
  ) {
    this.classList = { contains: (c) => this.classes.includes(c) };
  }
  add(...nodes: Node[]) {
    for (const n of nodes) {
      n.parentElement = this;
      this.children.push(n);
    }
    return this;
  }
  matches(selector: string): boolean {
    return selector.split(',').some((part) => {
      const steps = part.trim().split(/\s*>\s*/);
      const one = (node: Node | null, step: string) => {
        if (!node) return false;
        const attr = step.match(/^\[([\w-]+)\]$/);
        if (attr) return attr[1]! in node.attrs;
        const [tag, ...cls] = step.split('.');
        return (
          (!tag || node.tagName.toLowerCase() === tag) &&
          cls.every((c) => node.classes.includes(c))
        );
      };
      let node: Node | null = this as Node;
      for (let i = steps.length - 1; i >= 0; i--) {
        if (!one(node, steps[i]!)) return false;
        node = node!.parentElement;
      }
      return true;
    });
  }
  closest(selector: string): Node | null {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    for (let n: Node | null = this; n; n = n.parentElement)
      if (n.matches(selector)) return n;
    return null;
  }
  querySelector(selector: string): Node | null {
    for (const c of this.children) {
      if (c.matches(selector)) return c;
      const deep = c.querySelector(selector);
      if (deep) return deep;
    }
    return null;
  }
  contains(other: Node): boolean {
    for (let n: Node | null = other; n; n = n.parentElement)
      if (n === this) return true;
    return false;
  }
}
const pick = (n: Node | null) =>
  zoomImage(n as unknown as Element) as unknown as Node | null;

it('Survol : une carte en main ou une unité donne son illustration', () => {
  const img = new Node('IMG', ['card-art']);
  const label = new Node('SPAN', ['sr-only']);
  new Node('BUTTON', [], { 'data-card': 'c1' }).add(img, label);
  expect(pick(label)).toBe(img);
  expect(pick(img)).toBe(img);
});

it('Survol : le fond d’un champ ne s’agrandit pas, son en-tête oui', () => {
  const title = new Node('H3');
  const header = new Node('HEADER').add(title);
  const art = new Node('IMG', ['field-art']);
  const empty = new Node('P');
  new Node('SECTION', ['zone', 'battlefield']).add(header, art, empty);
  expect(pick(art)).toBeNull();
  expect(pick(empty)).toBeNull();
  expect(pick(title)).toBe(art);
});

it('Survol : les aperçus déjà grands et les zones sans carte ne s’agrandissent pas', () => {
  const preview = new Node('IMG', ['card-preview']);
  const text = new Node('P');
  new Node('DIV').add(preview, text);
  expect(pick(preview)).toBeNull();
  expect(pick(text)).toBeNull();
});

it('Position : à droite du pointeur si possible, sinon à gauche, toujours dans la fenêtre', () => {
  expect(zoomPosition(100, 500, 320, 446, 1600, 1000)).toEqual({
    left: 124,
    top: 277,
  });
  expect(zoomPosition(1500, 50, 320, 446, 1600, 1000)).toEqual({
    left: 1156,
    top: 8,
  });
  expect(zoomPosition(800, 990, 320, 446, 1600, 1000).top).toBe(546);
});
