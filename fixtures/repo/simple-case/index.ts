import { aaa, bbb } from './const-1';
export const exportedAAA = aaa;
export const exportedBBB = bbb + aaa + fun();
export { ccc as exportedCCC } from './const-1';

function fun() {
  return 'str';
}

export * as Cyclic1Exports from './cyclic-1';
export * as Cyclic2Exports from './cyclic-2';
