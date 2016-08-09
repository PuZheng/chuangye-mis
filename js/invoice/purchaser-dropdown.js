import $$ from '../xx.js';
import {searchDropdown} from '../dropdown.js';
import {$$invoice, $$purchasers} from './data-slots.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

export var $$purchaserDropdown = function () {
  let $$activated = $$(false, 'activated');
  let $$searchText = $$('', 'search-text');
  let valueFunc = function (activated, searchText, purchasers, invoice) {
    return searchDropdown({
      defaultText: '请选择购买方',
      options: purchasers.map( v => ({ value: v.id, text: v.name, abbr: v.abbr }) ),
      activated: activated,
      value: invoice.vendorId,
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
      match(option, searchText) {
        return ~option.text.indexOf(searchText) || ~option.abbr.indexOf(searchText);
      },
      optionContent(option) {
        if (!searchText) {
          return option.text;
        }
        let pos = option.text.indexOf(searchText);
        if (pos === -1) {
          pos = option.abbr.indexOf(searchText);
        }
        // not matched
        if (pos === -1) {
          return '';
        }
        let ret = [];
        if (pos > 0) {
          ret.push(option.text.slice(0, pos));
        }
        ret.push(h('span.color-accent', option.text.slice(pos, searchText.length)));
        if (pos + searchText.length < option.text.length) {
          ret.push(option.text.slice(pos + searchText.length, option.text.length));
        }
        return ret;
      }
    });
  };
  return $$.connect([$$activated, $$searchText, $$purchasers, $$invoice], valueFunc);
}();
