import x from '../xx.js';
import domDriver from '../dom-driver.js';
import tmpl from './object.ejs';
import { $$voucher, $$voucherTypes, $$loading } from './data-slots.js';
import * as $$datas from './data-slots.js';
import form from './form.js';

const voucherAppValueFunc = function (voucher, form) {
  return ejs.render(tmpl, {
    self: this,
    voucher,
    form,
  });
};

const $$view = x.connect(
  [$$voucher, form.$$view], voucherAppValueFunc, 'voucher-object-app');

domDriver.mount(
  $$view, document.getElementById('main'), 
  function (node) {
    form.config(node);
  }
);

export default Object.assign({}, {
  $$view
}, $$datas);;
