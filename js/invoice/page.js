import x from '../xx.js';
import form from './form.js';
import { $$loading, $$invoice } from './data-slots.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;


const $$view = x.connect(
  [$$loading, $$invoice, form.$$view], 
  function (loading, invoice, form) {
    return h('.object-app', [
      h('.header', invoice.id? `编辑发票-${invoice.number}`: '创建新发票'),
      form
    ]);
  }, 'invoice-page');

export default {
  $$view,
};
