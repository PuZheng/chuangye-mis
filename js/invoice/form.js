import moment from 'moment';
import {$$invoice, $$invoiceTypes, $$loading, $$accountTerms, $$selectedInvoiceType} from './data-slots.js';
import x from '../xx.js';
import R from 'ramda';
import once from 'once';
import page from 'page';
import invoiceStore from '../store/invoice-store.js';
import entityStore from '../store/entity-store.js';
import materialSubjectStore from '../store/material-subject-store.js';
import { $$materialsEditor } from './materials-editor.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;
import {dropdown, searchDropdown} from '../dropdown.js';
import {$$invoiceTypeDropdown, onInvoiceTypeChange} from './invoice-type-dropdown.js';
import {$$accountTermDropdown} from './account-term-dropdown.js';
import {$$vendorDropdown} from './vendor-dropdown.js';
import {$$purchaserDropdown} from './purchaser-dropdown.js';


const $$errors = x({}, 'invoice-form-errors');


$$invoice.change(function (invoice) {
  if (invoice.id && invoice.invoiceTypeId) {
    onInvoiceTypeChange(invoice.invoiceTypeId);
  }
});



function invoiceFormValueFunc(
  errors, loading,  
  invoice, 
  selectedInvoiceType, invoiceTypeDropdown,
  accountTermDropdown, vendorDropdown, purchaserDropdown,
  materialsEditor
) {
  let classNames = ['form', 'm1', 'clearfix'];
  loading && classNames.push('loading');
  classNames = classNames.map( c => '.' + c ).join();
  return h('form#invoice-form' + classNames, [
    h('.col.col-6', [
      h('.field.inline.required', [
        h('label', '发票类型'),
        invoiceTypeDropdown,
      ]),
      h('.field.inline', [
        h('label', '发票日期'),
        h('input', {
          type: 'date',
          value: invoice.date? invoice.date: moment().format('YYYY-MM-DD'),
          onchange(e) {
            $$invoice.patch({
              date: this.value
            });
          }
        }),
      ]),
      h('.field.inline.required', [
        h('label', '发票号码'),
        h('input', {
          type: 'text',
          value: invoice.number || '',
          onchange(e) {
            $$invoice.patch({
              number: this.value,
            });
          }
        }),
      ]),
      h('.field.inline', [
        h('label', '会计帐期'),
        accountTermDropdown,
      ]),
      selectedInvoiceType.vendorType? h('.field.inline', [
        h('label', '(实际)销售方'),
        vendorDropdown, 
      ]): '',
      selectedInvoiceType.purchaserType? h('.field.inline', [
        h('label', '(实际)购买方'),
        purchaserDropdown,
      ]): '',
      h('.field.inline', [
        h('input', {
          type: 'checkbox',
          checked: invoice.isVAT,
          onchange(e) {
            $$invoice.patch({ isVAT: this.checked });
          }
        }),
        h('label', '是否是增值税'),
      ]),
      h('.field.inline', [
        h('label', '备注'),
        h('textarea', {
          rows: 4,
          onchange(e) {
            $$invoice.patch({ notes: this.value });
          }
        })
      ]),
    ]),
    h('.col.col-6', [
      h('.field', [
        h('label', '物料明细'),
        selectedInvoiceType.materialType? materialsEditor: '' 
      ])
    ])
  ]);
}

const validate = function (invoice) {
  return Promise.resolve(invoice);
};

export default {
  view: x.connect(
    [$$errors, $$loading, $$invoice,
      $$selectedInvoiceType, 
      $$invoiceTypeDropdown,
      $$accountTermDropdown,
      $$vendorDropdown,
      $$purchaserDropdown,
      $$materialsEditor
    ],
    invoiceFormValueFunc, 
    'invoice-form'),
  config: function (node) {
    // let materialsEditorEl = node.querySelector('#' + materialsEditor.$$view.token);
    // materialsEditorEl && materialsEditor.config(materialsEditorEl);
  },
};
