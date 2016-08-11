import x from '../xx.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;
import { field } from '../field.js';

export const $$username = x('', 'username');
export const $$password = x('', 'password');

var $$page = x.connect(
  [$$username, $$password], 
  function (username, password) {
    return h('.mt4.p2.border.box.rounded.bc1.mx-auto.max-width-2', [
      h('h3', '欢迎登陆创业电镀管理系统'),
      h('.form', [
  
      ]),
    ]); 
  }
);

export default {
  page: {
    $$view: $$page,
  }
};
