import $$ from '../xx.js';
import { $$invoiceTypes, $$accountTerms, $$entities } from './data-slots';
import $$queryObj from '../query-obj';
import { dropdown, searchDropdown } from '../dropdown';
import $$searchBox from '../search-box-slot';
import invoiceStore from '../store/invoice-store';
import $$dropdown from '../dropdown-slot';
import $$searchDropdown from '../search-dropdown-slot';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;


var $$invoiceTypeFilter = $$dropdown({
  $$options: $$.connect([$$invoiceTypes], function (list) {
    return [{
      value: '',
      text: '不限发票类型'
    }].concat(list.map(function (t) {
      return {
        value: t.id,
        text: t.name,
      };
    }));
  }),
  $$value: $$.connect([$$queryObj], function (queryObj) {
    return queryObj.invoice_type_id;
  }),
  defaultText: '请选择发票类型',
  onchange(value, option) {
    $$queryObj.patch({
      invoice_type_id: value,
    });
  }
});

var $$dateFilter = $$dropdown({
  $$options: $$([
    { value: 'in_7_days', text: '7天内' },
    { value: 'in_30_days', text: '30天内' },
    { value: '', text: '不限日期' },
  ]),
  $$value: $$.connect([$$queryObj], function (queryObj) {
    return queryObj.date_span;
  }),
  defaultText: '请选择日期范围',
  onchange(value, option) {
    $$queryObj.patch({
      date_span: value,
    });
  }
});

var $$accountTermFilter = $$searchDropdown({
  defaultText: '请选择账期',
  $$value: $$.connect([$$queryObj], function (queryObj) {
    return queryObj.account_term_id;
  }),
  $$options: $$.connect([$$accountTerms], function (list) {
    return [
      { value: '', text: '不限账期' }
    ].concat(list.map(function (at) {
      return {
        value: at.id,
        text: at.name,
      };
    })); 
  }),
  onchange(value, option) {
    $$queryObj.patch({
      account_term_id: value,
    });
  }
});

var $$vendorFilter = $$searchDropdown({
  defaultText: '请选择销售方',
  $$value: $$.connect([$$queryObj], function (q) {
    return q.vendor_id;
  }),
  $$options: $$.connect([$$entities], function (entities) {
    return [
      { value: '', text: '不限销售方' },
    ].concat(entities.map(function (e) {
      return {
        value: e.id,
        text: e.name,
        acronym: e.acronym,
      };
    }));
  }),
  onchange(value, option) {
    $$queryObj.patch({
      vendor_id: value,
    });
  }
});

var $$purchaserFilter = $$searchDropdown({
  defaultText: '请选择购买方',
  $$value: $$.connect([$$queryObj], function (q) {
    return q.purchaser_id;
  }),
  $$options: $$.connect([$$entities], function (entities) {
    return [
      { value: '', text: '不限销售方' },
    ].concat(entities.map(function (e) {
      return {
        value: e.id,
        text: e.name,
        acronym: e.acronym,
      };
    }));
  }),
  onchange(value, option) {
    $$queryObj.patch({
      purchaser_id: value,
    });
  },
});

var $$numberFilter = $$searchBox({
  minLen: 2,
  defaultText: '搜索编号',
  $$searchText: $$.connect([$$queryObj], function (qo) {
    return qo.number__like || ''; 
  }),
  onsearch(searchText) {
    $$queryObj.patch({
      number__like: searchText,
    });
  },
  getHints(text) {
    return invoiceStore.getHints(text);
  }
});

export var $$filters = $$.connect([
  $$invoiceTypeFilter,
  $$dateFilter,
  $$accountTermFilter,
  $$vendorFilter,
  $$purchaserFilter,
  $$numberFilter,
], function (
  invoiceTypeFilter, dateFilter, accountTermFilter, vendorFilter,
  purchaserFilter, numberFilter
) {
  return h('.border.box.rounded.p1.border-gray', [
    numberFilter,
    invoiceTypeFilter,
    dateFilter,
    accountTermFilter,
    vendorFilter,
    purchaserFilter,
  ]); 
});

