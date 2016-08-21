import x from '../xx.js';
import { $$voucher } from './data-slots.js';
import * as $$datas from './data-slots.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;
import { $$form } from './form.js';

const valueFunc = function (voucher, form) {
  return h('.object-app', [
      h('.header', voucher.id? `编辑凭证-${voucher.number}`: '创建新凭证'),
      form,
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
