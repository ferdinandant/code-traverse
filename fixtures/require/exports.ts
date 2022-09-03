const a = require('a');
const b = require('b');

const x = 1;

module.exports = {
  a,
  x,
  fnc,
};

exports.yyy = 1;
exports.zzz = 2;

function fnc() {
  return b + 2;
}

function fnd() {
  // Should not detect this as export
  // because `module` is defined locally
  const module = {} as any;
  module.exports = 3;
  return module;
}

function fne() {
  // Should not detect this as export
  // because `module` is defined locally
  const module = {} as any;
  return function f() {
    module.exports = 3;
    return module;
  };
}
