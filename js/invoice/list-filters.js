import $$ from '../xx.js';
import {$$invoiceTypes, $$accountTerms} from './data-slots';
import $$queryObj from '../query-obj';
import {dropdown, searchDropdown} from '../dropdown.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

var $$invoiceTypeFilter = function () {
  let $$activated = $$(false, 'activated');
  let valueFunc = function (activated, invoiceTypes, queryObj) {
    return dropdown({
      defaultText: '请选择发票类型',
      options: invoiceTypes.map(function (t) {
        return {
          value: t.id,
          text: t.name,
        };
      }),
      value: queryObj.invoice_type_id,
      activated: activated,
      onactivate: function (b) {
        $$activated.val(b);
      },
      onchange: function (value, option) {
        $$queryObj.patch({
          invoice_type_id: value,
        });
      }
    });
  };
  return $$.connect([$$activated, $$invoiceTypes, $$queryObj], valueFunc);
}();

var $$dateFilter = function () {
  let $$activated = $$(false, 'activated');
  let options = [
    { value: 'in_7_days', text: '7天内' },
    { value: 'in_30_days', text: '30天内' },
    { value: '', text: '不限日期' },
  ];
  let valueFunc = function (activated, queryObj) {
    return dropdown({
      defaultText: '请选择日期范围',
      options,
      value: queryObj.date_span,
      activated: activated,
      onactivate: function (b) {
        $$activated.val(b);
      },
      onchange: function (value, option) {
        $$queryObj.patch({
          date_span: value,
        });
      }
    });
  };
  return $$.connect([$$activated, $$queryObj], valueFunc);
}();

var $$accountTermFilter = function () {
  return $$.connect([$$accountTerms, $$queryObj], function (accountTerms, queryObj) {
    return searchDropdown() 
  });
  let $$searchText = $$('', 'search-text');
  let $$activated = $$(false, 'activated');
  let valueFunc = function (activated, searchText, accountTerms, queryObj) {
    return searchDropdown({
      defaultText: '请选择帐期',
      searchText,
      options: accountTerms.map(at => (
        {
          value: at.id,
          text: at.name,
        }
      )),
      value: queryObj.account_term_id,
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
}();


var $$vendorFilter = function () {
  
}();

var $$purchaserFilter = function () {
  
}();

var $$numberFilter = function () {
   
}();

export var $$filters = $$.connect([
  $$invoiceTypeFilter,
  $$dateFilter,
], function (invoiceTypeFilter, dateFilter) {
  return h('.border.box.rounded.p1.border-gray', [
    invoiceTypeFilter,
    dateFilter,
  ]); 
});

