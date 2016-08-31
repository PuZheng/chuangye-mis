import $$ from 'slot';
import form from './form.js';
import { $$loading, $$invoice } from './data-slots.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;


const $$view = $$.connect(
  [$$loading, $$invoice, form.$$view], 
  function ([loading, invoice, form]) {
    return h('.object-app' + (loading? '.loading': ''), [
      h('.header', invoice.id? `编辑发票-${invoice.number}`: '创建新发票'),
      form
    ]);
  }, 'invoice-page');

export default {
  $$view,
};
