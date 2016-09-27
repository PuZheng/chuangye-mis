import moment from 'moment';
import { $$invoice, $$loading } from './data-slots.js';
import x from 'slot';
import page from 'page';
import invoiceStore from '../store/invoice-store.js';
import { $$materialsEditor } from './materials-editor.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;
import {$$invoiceTypeDropdown, onInvoiceTypeChange} from './invoice-type-dropdown.js';
import {$$accountTermDropdown} from './account-term-dropdown.js';
import {$$vendorDropdown} from './vendor-dropdown.js';
import {$$purchaserDropdown} from './purchaser-dropdown.js';
import { field } from '../field.js';
import { $$toast } from '../toast';
import co from 'co';
import R from 'ramda';


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


var valueFunc = function valueFunc([
  errors, loading,  
  invoice, 
  invoiceTypeDropdown,
  accountTermDropdown, vendorDropdown, purchaserDropdown,
  materialsEditor
]) {
  let classNames = ['form'];
  loading && classNames.push('loading');
  classNames = classNames.map( c => '.' + c ).join();
  return h('form.form#invoice-form' + classNames, {
    onsubmit() {
      co(function *() {
        try {
          yield invoiceStore.validate(invoice);
        } catch (e) {
          $$errors.val(e);
          return;
        } 
        try {
          $$loading.inc();
          let { id } = yield invoiceStore.save(invoice);
          $$toast.val({
            type: 'success',
            message: '发票创建成功',
          });
          page('/invoice/' + id);
        } catch (e) {
          console.error(e);
        } finally {
          $$loading.dec();
        }
      });
      return false;
    }
  }, [
    h('.col.col-6', [
      field({
        key: 'invoiceType', 
        label: '发票类型', 
        input: invoiceTypeDropdown, 
        errors,
        required: true
      }),
      field({
        key: 'date', 
        label: '发票日期', 
        input: h('input', {
          type: 'date',
          value: invoice.date? invoice.date: moment().format('YYYY-MM-DD'),
          oninput() {
            $$invoice.patch({
              date: this.value
            });
          }
        }), 
        errors,
      }),
      field({
        key: 'number', 
        label: '发票号码', 
        input: h('input', {
          type: 'text',
          placeholder: '请输入发票号码',
          value: invoice.number || '',
          onchange() {
            $$invoice.patch({
              number: this.value,
            });
          }
        }), 
        errors,
        required: true
      }),
      field({
        key: 'accountTermId', 
        label: '会计帐期', 
        input: accountTermDropdown, 
        errors,
        required: true
      }),
      R.ifElse(
        R.path(['invoiceType', 'vendorType']),
        function () {
          return field({
            key: 'vendorId', 
            label: '销售方', 
            input: vendorDropdown, 
            errors,
            required: true
          });
        },
        R.always('')
      )(invoice),
      R.ifElse(
        R.path(['invoiceType', 'purchaserType']),
        function () {
          return field({
            key: 'purchaserId', 
            label: '购买方', 
            input: purchaserDropdown, 
            errors,
            required: true
          });
        },
        R.always('')
      )(invoice),
      (invoice.invoiceType || {}).purchaserType? field(): '',
      h('.field.inline', [
        h('input', {
          type: 'checkbox',
          checked: invoice.isVat,
          onchange() {
            $$invoice.patch({ isVat: this.checked });
          }
        }),
        h('label', '是否是增值税'),
      ]),
      h('.field.inline', [
        h('label', '备注'),
        h('textarea', {
          rows: 4,
          onchange() {
            $$invoice.patch({ notes: this.value });
          }
        }, invoice.notes || ''),
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
    h('button.primary', '提交'),
    h('button', {
      onclick(e) {
        e.preventDefault();
        page('/invoice-list');
        return false;
      }
    }, '返回'),
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
