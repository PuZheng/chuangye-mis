import { $$dropdown } from '../widget/dropdown';
import { $$voucher, $$voucherTypes } from './data-slots';
import $$ from '../xx.js';

export var $$voucherTypeDropdown = $$dropdown({
  defaultText: '请选择凭证类型',
  onchange(value) {
    $$voucher.patch({ voucherTypeId: value });
  },
  $$options: $$.connect([$$voucherTypes], function (l) {
    return l.map(vt => ({
      value: vt.id,
      text: vt.name,
    }));
  }),
  $$value: $$.connect([$$voucher], function (o) {
    return o.voucherTypeId;
  }),
});
