import $$ from '../xx.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

var $$view = $$.connect([], function () {
  return h('h1', 'dashboard not yet implemented');
});

export default {
  page: {
    $$view
  }
};
