import { dropdown } from '../dropdown.js';
import { $$voucher, $$voucherTypes } from './data-slots.js';
import $$ from '../xx.js';

var $$activated = $$(false, 'activated');

var valueFunc = function valueFunc(activated, voucherTypes, voucher) {
  return dropdown({
    defaultText: '请选择凭证类型',
    options: voucherTypes.map( vt => ({
      value: vt.id,
      text: vt.name,
    }) ),
    value: voucher.voucherTypeId,
    activated,
    onactivate(b) {
      $$activated.val(b);
    },
    onchange(value) {
      $$voucher.patch({ voucherTypeId: value });
    }
  });
};

export var $$voucherTypeDropdown = $$.connect(
  [$$activated, $$voucherTypes, $$voucher], valueFunc);
