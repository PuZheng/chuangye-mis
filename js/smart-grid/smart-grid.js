import x from '../xx.js';
var h = virtualDom.h;

const $$def = x({}, 'def');
const $$data = x([], 'data');

var smartGridValueFunc = function (def, data) {
  return h('h1', 'smart grid');
};

export default {
  $$view: x.connect([$$def, $$data], smartGridValueFunc),
  $$def,
  $$data
};
