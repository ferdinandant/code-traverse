const init = 0;

export const a = 5;
const b = 6;
const c = 7;

function sum() {
  return b + c;
}

export const m = -1,
  n = b + sum();
export const { p, q = init, ...s } = { p: 1, q: a } as Record<string, any>;
export const [t, u, ...w] = [2, 3, 4, c];

export function d(c = init) {
  return 7;
}
export class E {
  a = 1;
  constructor() {
    this.a = a;
  }
}

export type F = Record<string, string>;
export interface I {
  a: string;
  b: typeof init;
}

export default a + b;
export { default as default1, xx as xxx, yy } from './mdle';
export { g, h, i } from './mdlf';
export * from './mdlg';
