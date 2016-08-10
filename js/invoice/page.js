import x from '../xx.js';
import form from './form.js';
import { $$invoiceTypes, $$loading, $$invoice, $$vendors, $$purchasers, $$accountTerms } from './data-slots.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;


const $$view = x.connect(
  [$$loading, $$invoice, form.$$view], 
  function (loading, invoice, form) {
    return h('.m2', [
      h('.p2.c1.h2.italic', invoice.id? `编辑发票-${invoice.number}`: '创建新发票'),
      h('.border-box.border.color-primary-text.border-gray-light', form)
    ]);
  }, 'invoice-page');

export default {
  $$view,
};
