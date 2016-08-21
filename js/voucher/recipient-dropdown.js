import { $$voucher, $$recipients } from './data-slots';
import { $$searchDropdown } from '../search-dropdown-slot';
import $$ from '../xx.js';

export var $$recipientDropdown = $$searchDropdown({
  defaultText: '请选择支付方',
  onchange(value) {
    $$voucher.patch({
      recipientId: parseInt(value),
    });
  },
  $$options: $$.connect([$$recipients], function (l) {
    return l.map(it => (
      { 
        value: it.id,
        text: it.name,
        acronym: it.acronym,
      }
    ));
  }),
  $$value: $$.connect([$$voucher], function (o) {
    return o.recipientId;
  }),
});
