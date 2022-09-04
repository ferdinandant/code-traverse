import { cycle2 } from './cyclic-2';

export function cycle1(int: number) {
  if (int < 0) {
    return;
  }
  cycle2(int - 1);
}

export * from './cyclic-tail';
