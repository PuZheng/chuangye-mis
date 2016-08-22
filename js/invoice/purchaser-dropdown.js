import $$ from '../xx.js';
import { $$searchDropdown } from '../widget/search-dropdown';
import {$$invoice, $$purchasers} from './data-slots';

export var $$purchaserDropdown = $$searchDropdown({
  defaultText: '请选择购买方',
  $$options: $$.connect([$$purchasers], function (l) {
    return l.map(p => ({ 
      value: p.id, text: p.name, acronym: p.acronym 
    }));
  }),
  onchange(value) {
    $$invoice.patch({
      purchaserId: parseInt(value)
    });
  },
  $$value: $$.connect([$$invoice], function (o) {
    return o.purchaserId;
  }),
});
