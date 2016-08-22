import $$ from '../xx';
import $$dropdown from '../widget/dropdown';
import {$$invoice, $$invoiceTypes, $$loading, $$vendors, $$purchasers, $$selectedInvoiceType} from './data-slots';
import R from 'ramda';
import entityStore from '../store/entity-store';
import materialSubjectStore from '../store/material-subject-store';
import { $$materialSubjects } from './materials-editor';

export var $$invoiceTypeDropdown = $$dropdown({
  defaultText: '请选择发票类型',
  onchange(value) {
    onInvoiceTypeChange(value);
  },
  $$options: $$.connect([$$invoiceTypes], function (l) {
    return l.map(function (it) {
      return {
        value: it.id,
        text: it.name,
      };
    });
  }),
  $$value: $$.connect([$$invoice], function (o) {
    return o.invoiceTypeId;
  }),
});

export var onInvoiceTypeChange = function (value) {
  value = parseInt(value);
  $$loading.inc();
  // find the corresponding invoice type
  var invoiceType = R.find(R.propEq('id', value))($$invoiceTypes.val());
  Promise.all([
    invoiceType.vendorType?  entityStore.fetchList({
      type: invoiceType.vendorType
    }): [],
    invoiceType.purchaserType?  entityStore.fetchList({
      type: invoiceType.purchaserType,
    }): [],
    invoiceType.materialType? materialSubjectStore.fetchList({ type: invoiceType.materialType }): [],
  ]).then(function ([vendors, purchasers, materialSubjects]) {
    $$.update(
      [$$loading, $$loading.val() - 1],
      [$$invoice, Object.assign($$invoice.val(), {
        invoiceTypeId: value,
        invoiceType: invoiceType,
        isVat: invoiceType.isVat,
      })],
      [$$selectedInvoiceType, invoiceType],
      [$$vendors, vendors],
      [$$purchasers, purchasers],
      [$$materialSubjects, materialSubjects]
    );
  });
};
