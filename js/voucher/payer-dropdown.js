import { $$voucher, $$payers } from './data-slots';
import { $$searchDropdown } from '../search-dropdown-slot';
import $$ from '../xx.js';

export var $$payerDropdown = $$searchDropdown({
    defaultText: '请选择支付方',
    onchange(value) {
      $$voucher.patch({
        payerId: parseInt(value),
      });
    },
    $$options: $$.connect([$$payers], function (l) {
      return l.map(p => (
        { 
          value: p.id,
          text: p.name,
          acronym: p.acronym,
        }
      ));
    }),
    $$value: $$.connect([$$voucher], function (o) {
      return o.payerId;
    })
});
