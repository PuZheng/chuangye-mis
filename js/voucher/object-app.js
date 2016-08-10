import x from '../xx.js';
import { $$voucher, $$voucherTypes, $$loading } from './data-slots.js';
import * as $$datas from './data-slots.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;
import { $$form } from './form.js';

const valueFunc = function (voucher, form) {
  return h('.m2', [
      h('.p2.c1.h2.italic', voucher.id? `编辑凭证-${voucher.number}`: '创建新凭证'),
      h('.border-box.border.ct1.border-gray-light', form)
  ]);
};

const $$view = x.connect(
  [$$voucher, $$form], 
  valueFunc, 
  'voucher-object-app');

export default Object.assign({}, {
  page: {
    $$view,
  },
}, $$datas);;
