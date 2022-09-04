export class Stack<T extends string | number> {
  arr: Array<T>;
  valueCount: Record<T, number>;

  constructor() {
    this.arr = [];
    this.valueCount = Object.create(null);
  }

  get size() {
    return this.arr.length;
  }

  push(value: T) {
    this.arr.push(value);
    if (this.valueCount[value] === undefined) {
      this.valueCount[value] = 1;
    } else {
      this.valueCount[value]++;
    }
  }

  top() {
    const lastIdx = this.arr.length - 1;
    return this.arr[lastIdx];
  }

  pop() {
    if (this.arr.length === 0) {
      throw new Error('Popping an empty stack');
    }
    const top = this.arr.pop()!;
    this.valueCount[top]--;
    return top;
  }

  has(value: T) {
    return Boolean(this.valueCount[value]);
  }
}
