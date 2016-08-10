import $$ from '../xx.js';
import {$$object, $$loading} from './data-slots.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

var $$errors = $$({}, 'invoice-form-errors');

$$object.change(function () {
  let id;
  return function (invoice) {
    if ((invoice.id != id) && invoice.invoiceTypeId) {
      onInvoiceTypeChange(invoice.invoiceTypeId);
    }
    id = invoice.id;
  };
}());

var validate = function (invoice) {
  return Promise.resolve(invoice);
};

var valueFunc = function valueFunc(
  ...,
  loading, errors, object,  
) {
  let classNames = ['form', 'm1', 'clearfix'];
  loading && classNames.push('loading');
  classNames = classNames.map( c => '.' + c ).join();
  let fields = [];
  return h(classNames, [
    ...fields,
    h('.clearfix'),
    h('hr'),
    h('button.btn.c1.btn-outline.m1', {
      onclick(e) {
        validate($$object.val()).then(function () {
          // save data
        }).catch($$errors.val);
        return false;
      }
    }, '提交')
  ]);
}


export var $$form = x.connet([..., $$loading, $$errors, $$object], valueFunc, 
                            'form');
