export * from './mdla';
export * from './mdlb';
export * as C from './mdlc';

const a = 1;
const b = 2;
const c = 3;
export { a, b as bb, c as 'ddd' };
