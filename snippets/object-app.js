import $$ from '../xx.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;
import { $$object, ... } from './data-slots.js';
import { $$form } from './form.js';

const valueFunc = function (object, form) {
  return h('.m2', [
    h('.p2.c1.h2.italic', voucher.id? `编辑<FOO>-${object.id}`: '创建<FOO>'),
      h('.border-box.border.ct1.border-gray-light', form)
  ]);
};

var $$view = $$.connect(
  [$$object, $$form, ...], 
  valueFunc, 
  '$$app name$$-object-app');

export default {
  page: {
    $$view,
  },
};
