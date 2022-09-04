const a = require('./a');
const b = require('./' + 'b');
const { e, f } = require('./e');
const { g: G, h: H } = require('./f');
const { i, j, ['key' + e]: spc, ...k } = require('./g');
const [l, m, ...n] = require('./h');
require('./i');

const p = require('./h').p;
const q = require('./i').p.q;
const r = require('./j')['ha' + 'ha'];
require('./k').extra;

let c;
if (a !== undefined) {
  c = require('./c');
}

function getC() {
  return c;
}

function getD() {
  return require('./d');
}

function getSum2() {
  return e + f;
}
function getSum() {
  return getSum2();
}
