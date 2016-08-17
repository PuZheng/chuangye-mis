import { $$voucher, $$payers } from './data-slots.js';
import { searchDropdown } from '../dropdown.js';
import $$ from '../xx.js';
import { match, optionContent } from '../dropdown-utils.js';

var $$activated = $$(false, 'activated');
var $$searchText = $$('', 'search-text');

var valueFunc = function (activated, searchText, payers, voucher) {
  return searchDropdown({
    defaultText: '请选择支付方',
    searchText,
    options: payers.map( p => (
      { 
        value: p.id,
        text: p.name,
        acronym: p.acronym,
      }
    ) ),
    value: voucher.payerId,
    activated,
    onactivate(b) {
      $$activated.val(b);
    },
    onchange(value) {
      $$voucher.patch({
        payerId: parseInt(value),
      });
    },
    onsearch(searchText) {
      $$searchText.val(searchText);
    },
    match,
    optionContent(option) {
      return optionContent(option, searchText);
    },
  });
};

export var $$payerDropdown = $$.connect(
  [$$activated, $$searchText, $$payers, $$voucher], valueFunc
);
