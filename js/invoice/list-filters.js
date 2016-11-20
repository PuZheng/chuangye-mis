import $$ from 'slot';
import { $$invoiceTypes, $$accountTerms, $$entities } from './data-slots';
import $$queryObj from '../query-obj';
import $$dropdown from '../widget/dropdown';
import $$searchDropdown from '../widget/search-dropdown';
import virtualDom from 'virtual-dom';
import R from 'ramda';
var h = virtualDom.h;


var $$invoiceTypeFilter = $$dropdown({
  $$options: $$invoiceTypes.trans(R.map(it => ({
    value: it.id,
    text: it.name
  }))),
  $$value: $$queryObj.trans(R.prop('invoice_type_id')),
  defaultText: '请选择发票类型',
  onchange(invoice_type_id) {
    $$queryObj.patch({ invoice_type_id, });
  }
});

var $$dateFilter = $$dropdown({
  $$options: $$([
    { value: 'in_7_days', text: '7天内' },
    { value: 'in_30_days', text: '30天内' },
  ]),
  $$value: $$queryObj.trans(R.prop('date_span')),
  defaultText: '请选择日期范围',
  onchange(date_span) {
    $$queryObj.patch({ date_span, });
  }
});

var $$accountTermFilter = $$searchDropdown({
  defaultText: '请选择账期',
  $$value: $$queryObj.trans(R.prop('account_term_id')),
  $$options: $$accountTerms.trans(R.map(it => ({
    value: it.id,
    text: it.name,
  }))),
  onchange(account_term_id) {
    $$queryObj.patch({ account_term_id, });
  }
});

var $$vendorFilter = $$searchDropdown({
  defaultText: '请选择销售方',
  $$value: $$queryObj.trans(R.prop('vendor_id')),
  $$options: $$entities.trans(R.map(it => ({
    value: it.id,
    text: it.name,
    acronym: it.acronym
  }))),
  onchange(vendor_id) {
    $$queryObj.patch({ vendor_id });
  }
});

var $$purchaserFilter = $$searchDropdown({
  defaultText: '请选择购买方',
  $$value: $$queryObj.trans(R.prop('purchaser_id')),
  $$options: $$entities.trans(R.map(it => ({
    value: it.id,
    text: it.name,
    acronym: it.acronym
  }))),
  onchange(value) {
    $$queryObj.patch({
      purchaser_id: value,
    });
  },
});

export var $$filters = $$.connect([
  $$invoiceTypeFilter,
  $$dateFilter,
  $$accountTermFilter,
  $$vendorFilter,
  $$purchaserFilter,
], function ([
  invoiceTypeFilter, dateFilter, accountTermFilter, vendorFilter,
  purchaserFilter
]) {
  return h('.filters', [
    invoiceTypeFilter,
    dateFilter,
    accountTermFilter,
    vendorFilter,
    purchaserFilter,
  ]);
});

