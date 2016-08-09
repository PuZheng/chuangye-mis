import $$ from '../xx.js';
import {dropdown} from '../dropdown.js';
import {$$invoice, $$accountTerms} from './data-slots.js';

export var $$accountTermDropdown = function () {
  let $$activated = $$(false, 'activated');
  let valueFunc = function (activated, accountTerms, invoice) {
    return dropdown({
      defaultText: '请选择会计账期',
      options: accountTerms.map(function (t) {
        return {
          value: t.id,
          text: t.name,
        };
      }),
      value: invoice.accountTermId,
      activated: activated,
      onactivate(b) {
        $$activated.val(b);
      },
      onchange(value, option) {
        $$invoice.patch({
          accountTermId: parseInt(value),
        });
      },
    });
  };
  return $$.connect([$$activated, $$accountTerms, $$invoice], valueFunc);
}();
