import $$ from '../xx.js';
import {searchDropdown} from '../dropdown.js';
import {$$invoice, $$vendors} from './data-slots.js';
import { match, optionContent } from '../dropdown-utils.js';

export var $$vendorDropdown = function () {
  let $$activated = $$(false, 'activated');
  let $$searchText = $$('', 'search-text');
  let valueFunc = function (activated, searchText, vendors, invoice) {
    return searchDropdown({
      defaultText: '请选择销售方',
      options: vendors.map( v => ({ value: v.id, text: v.name, acronym: v.acronym }) ),
      activated: activated,
      value: invoice.vendorId,
      onactivate(b) {
        $$activated.val(b);
        $$searchText.val('');
      },
      onchange(value, option) {
        $$invoice.patch({
          vendorId: parseInt(value)
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
  return $$.connect([$$activated, $$searchText, $$vendors, $$invoice], valueFunc);
}();
