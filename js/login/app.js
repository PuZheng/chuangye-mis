import x from '../xx.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

export const $$username = x('', 'username');
export const $$password = x('', 'password');

var $$page = x.connect(
  [$$username, $$password], 
  function (username, password) {
    return h('.ui.grid.container', [
      h('h1', 'login'),
    ]); 
  }
);

export default {
  page: {
    $$view: $$page,
  }
};
