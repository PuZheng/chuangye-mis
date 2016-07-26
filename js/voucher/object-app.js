import x from '../xx.js';
import domDriver from '../dom-driver.js';
import tmpl from './object.ejs';
import { voucherSlot, voucherTypesSlot, loadingSlot } from './data-slots.js';
import * as dataSlots from './data-slots.js';
import form from './form.js';

const voucherAppValueFunc = function (voucher, form) {
  return ejs.render(tmpl, {
    self: this,
    voucher,
    form,
  });
};

const viewSlot = x.connect(
  [voucherSlot, form.viewSlot], voucherAppValueFunc, 'voucher-object-app');

domDriver.mount(
  viewSlot, document.getElementById('main'), 
  function (node) {
    form.config(node);
  }
);

export default Object.assign({}, {
  viewSlot
}, dataSlots);;
