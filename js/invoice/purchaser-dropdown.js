import $$ from '../xx.js';
import {searchDropdown} from '../dropdown.js';
import {$$invoice, $$purchasers} from './data-slots.js';
import { match, optionContent } from '../dropdown-utils.js';

export var $$purchaserDropdown = function () {
  let $$activated = $$(false, 'activated');
  let $$searchText = $$('', 'search-text');
  let valueFunc = function (activated, searchText, purchasers, invoice) {
    return searchDropdown({
      defaultText: '请选择购买方',
      options: purchasers.map( v => ({ value: v.id, text: v.name, abbr: v.abbr }) ),
      activated: activated,
      value: invoice.purchaserId,
      onactivate(b) {
        $$activated.val(b);
        $$searchText.val('');
      },
      onchange(value, option) {
        $$invoice.patch({
          purchaserId: parseInt(value)
        });
      },
      onsearch(value) {
        $$searchText.val(value);
      },
      searchText,
      match, 
      optionContent(option) {
        return optionContent(option, searchText);
      }
    });
  };
  return $$.connect([$$activated, $$searchText, $$purchasers, $$invoice], valueFunc);
}();
