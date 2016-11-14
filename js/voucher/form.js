import x from 'slot';
import { $$voucher, $$loading } from './data-slots.js';
import page from 'page';
import voucherStore from '../store/voucher-store.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;
import { $$voucherTypeDropdown } from './voucher-type-dropdown.js';
import { $$voucherSubjectDropdown, onVoucherSubjectChange } from './voucher-subject-dropdown.js';
import { $$payerDropdown } from './payer-dropdown.js';
import { $$recipientDropdown } from './recipient-dropdown.js';
import { field } from '../field';
import { $$toast } from '../toast';
import co from 'co';

const $$errors = x({}, 'errors');

$$voucher.change(function () {
  let id;
  return function (voucher) {
    if ((voucher.id != id) && voucher.voucherSubjectId) {
      id = voucher.id;
      onVoucherSubjectChange(voucher.voucherSubjectId);
    }
    $$errors.val({});
  };
}());


const valueFunc = function valueFunc([
  loading, voucher, errors,
  voucherTypeDropdown, voucherSubjectDropdown,
  payerDropdown, recipientDropdown
]) {
  let classNames = ['form', 'relative'];
  loading && classNames.push('loading');
  classNames = classNames.map( c => '.' + c ).join('');
  return h('form' + classNames, {
    onsubmit() {
      co(function *() {
        try {
          yield voucherStore.validate(voucher);
        } catch (e) {
          $$errors.val(e);
          return;
        }
        try {
          $$loading.val(true);
          let { id } = yield voucherStore.save(voucher);
          $$toast.val({
            type: 'success',
            message: '凭证创建成功',
          });
          page('/voucher/' + id);
        } catch (e) {
          console.error(e);
        } finally {
          $$loading.val(false);
        }
      });
      return false;
    }
  }, [
    field({
      key: 'voucherTypeId',
      label: '凭证类型',
      input: voucherTypeDropdown,
      errors,
      required: true,
    }),
    field({
      key: 'voucherSubjectId',
      label: '项目',
      input: voucherSubjectDropdown,
      errors,
      required: true,
    }),
    field({
      key: 'amount',
      label: '金额(元)',
      input: h('input', {
        onchange() {
          $$voucher.patch({ amount: this.value });
        },
        value: voucher.amount,
      }),
      errors,
      require: true,
    }),
    field({
      key: 'date',
      label: '日期',
      input: h('input', {
        type: 'date',
        value: voucher.date,
        onchange() {
          $$voucher.patch({
            date: this.value,
          });
        }
      }),
      errors,
      required: true
    }),
    field({
      key: 'number',
      label: '凭证号',
      input: h('input', {
        placeholder: '请输入凭证号',
        value: voucher.number,
        onchange() {
          $$voucher.patch({ number: this.value });
        }
      }),
      errors,
      required: true
    }),
    h('.field.inline', [
      h('input', {
        type: 'checkbox',
        checked: voucher.isPublic,
        onchange() {
          $$voucher.patch({ isPublic: this.checked });
        }
      }),
      h('label', {
        onclick() {
          $$voucher.patch({ isPublic: !$$voucher.val().isPublic });
        }
      }, '是否进入总账'),
    ]),
    field({
      key: 'payerId',
      label: '(实际)支付方',
      input: payerDropdown,
      errors,
      required: true
    }),
    field({
      key: 'recipientId',
      label: '(实际)收入方',
      input: recipientDropdown,
      errors,
      required: true
    }),
    h('.clearfix'),
    h('hr'),
    h('button.primary', '提交'),
    h('button', {
      onclick(e) {
        e.preventDefault();
        page('/voucher-list');
        return false;
      }
    }, '返回'),
  ]);
};

export var $$form = x.connect([
  $$loading, $$voucher, $$errors,
  $$voucherTypeDropdown, $$voucherSubjectDropdown,
  $$payerDropdown, $$recipientDropdown
], valueFunc, 'voucher-form');
