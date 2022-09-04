import { aaa, bbb } from './const-1';
export const exportedAAA = aaa;
export const exportedBBB = bbb + aaa;
export { ccc as exportedCCC } from './const-1';

export * as Cyclic1Exports from './cyclic-1';
export * as Cyclic2Exports from './cyclic-2';
