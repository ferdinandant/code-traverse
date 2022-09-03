import a from './mdla';
import * as B from './mdlb';
import { objD as D, objE as E } from './mdlc';
import { default as nil, x, y, z } from './mdld';
import './mldh';

const sum = a + B.b;

let sum2 = 0;
if (true) {
  sum2 = nil + x + y + z;
}

export default 'my-string';
export const d = sum;

export function useA() {
  return a;
}
export function useAB() {
  const ccc = 12;
  return a + B.b + ccc;
}
export function getSum() {
  return sum;
}
export function getSum2() {
  return sum2;
}

export function createObj(i: number) {
  let sum: any = {};
  if (i <= 0) {
    sum.d = { ...D };
    sum.e = { ...E };
  }
  createObj(i - 1);
  return sum;
}

function myInnerFunction() {
  return x + D.value;
}
export function getComplexSum() {
  return Object.keys(E).length + myInnerFunction();
}
