import { $$voucher, $$recipients } from './data-slots.js';
import { searchDropdown } from '../dropdown.js';
import $$ from '../xx.js';
import { match, optionContent } from '../dropdown-utils.js';

var $$activated = $$(false, 'activated');
var $$searchText = $$('', 'search-text');

var valueFunc = function (activated, searchText, recipients, voucher) {
  return searchDropdown({
    defaultText: '请选择支付方',
    searchText,
    options: recipients.map( p => (
      { 
        value: p.id,
        text: p.name,
        acronym: p.acronym,
      }
    ) ),
    value: voucher.recipientId,
    activated,
    onactivate(b) {
      $$activated.val(b);
    },
    onchange(value) {
      $$voucher.patch({
        recipientId: parseInt(value),
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

export var $$recipientDropdown = $$.connect(
  [$$activated, $$searchText, $$recipients, $$voucher], valueFunc
);
