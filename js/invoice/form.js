import moment from 'moment';
import { $$invoice, $$invoiceTypes, $$loading, $$accountTerms } from './data-slots.js';
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
import { field } from '../field.js';


var $$errors = x({}, 'invoice-form-errors');

$$invoice.change(function () {
  let id;
  return function (invoice) {
    if ((invoice.id != id) && invoice.invoiceTypeId) {
      onInvoiceTypeChange(invoice.invoiceTypeId);
    }
    id = invoice.id;
    $$errors.val({});
  };
}());


var valueFunc = function valueFunc(
  errors, loading,  
  invoice, 
  invoiceTypeDropdown,
  accountTermDropdown, vendorDropdown, purchaserDropdown,
  materialsEditor
) {
  let classNames = ['form', 'm1', 'clearfix'];
  loading && classNames.push('loading');
  classNames = classNames.map( c => '.' + c ).join();
  return h('form#invoice-form' + classNames, [
    h('.col.col-6', [
      field('invoiceType', '发票类型', invoiceTypeDropdown, errors, true),
      field('date', '发票日期', h('input', {
        type: 'date',
        value: invoice.date? invoice.date: moment().format('YYYY-MM-DD'),
        onchange(e) {
          $$invoice.patch({
            date: this.value
          });
        }
      }), errors),
      field('number', '发票号码', h('input', {
        type: 'text',
        placeholder: '请输入发票号码',
        value: invoice.number || '',
        onchange(e) {
          $$invoice.patch({
            number: this.value,
          });
        }
      }), errors, true),
      field('accountTermId', '会计帐期', accountTermDropdown, errors, true),
      (invoice.invoiceType || {}).vendorType? field('vendorId', '销售方', vendorDropdown, errors, true): '',
      (invoice.invoiceType || {}).purchaserType? field('purchaserId', '购买方', purchaserDropdown, errors, true): '',
      h('.field.inline', [
        h('input', {
          type: 'checkbox',
          checked: invoice.isVat,
          onchange(e) {
            $$invoice.patch({ isVat: this.checked });
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
    (invoice.invoiceType || {}).materialType? h('.col.col-6', [
      h('.field', [
        h('label', '物料明细'),
        materialsEditor,
      ])
    ]): '',
    h('.clearfix'),
    h('hr'),
    h('button.btn.c1.btn-outline.m1', {
      onclick(e) {
        invoiceStore.validate($$invoice.val()).then(function () {
          $$loading.inc();
          invoiceStore.save($$invoice.val()).then(function (id) {
            $$loading.dec();
            page('/invoice/' + id);
          });
        }).catch(function (errors) {
          $$errors.val(errors);
        });
        return false;
      }
    }, '提交')
  ]);
};

export default {
  $$view: x.connect(
    [$$errors, $$loading, $$invoice,
      $$invoiceTypeDropdown,
      $$accountTermDropdown,
      $$vendorDropdown,
      $$purchaserDropdown,
      $$materialsEditor
    ],
    valueFunc, 
    'invoice-form'),
};
