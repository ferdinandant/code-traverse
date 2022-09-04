import { cycle1 } from './cyclic-1';

export function cycle2(int: number) {
  if (int < 0) {
    return;
  }
  cycle1(int - 1);
}

export * from './cyclic-tail';
