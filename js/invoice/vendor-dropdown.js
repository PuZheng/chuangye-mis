import $$ from 'slot';
import { $$searchDropdown } from '../widget/search-dropdown';
import {$$invoice, $$vendors} from './data-slots.js';

export var $$vendorDropdown = $$searchDropdown({
  defaultText: '请选择销售方',
  $$value: $$.connect([$$invoice], ([o]) => o.vendorId),
  $$options: $$.connect([$$vendors], ([l]) => l.map(function (v) {
    return { value: v.id, text: v.name, acronym: v.acronym };
  })),
  onchange(value) {
    $$invoice.patch({
      vendorId: parseInt(value)
    });
  },
});
