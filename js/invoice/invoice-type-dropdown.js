import $$ from '../xx';
import {dropdown} from '../dropdown.js';
import {$$invoice, $$invoiceTypes, $$loading, $$vendors, $$purchasers, $$selectedInvoiceType} from './data-slots.js';
import R from 'ramda';
import entityStore from '../store/entity-store.js';
import materialSubjectStore from '../store/material-subject-store.js';
import { $$materialSubjects } from './materials-editor.js';

export var $$invoiceTypeDropdown = function () {
  let $$activated = $$(false, 'activated');
  let valueFunc = function (activated, invoiceTypes, invoice) {
    return dropdown({
      defaultText: '请选择发票类型',
      options: invoiceTypes.map(function (t) {
        return {
          value: t.id,
          text: t.name,
        };
      }),
      value: invoice.invoiceTypeId,
      activated: activated,
      onactivate: function (b) {
        $$activated.val(b);
      },
      onchange: function (value, option) {
        onInvoiceTypeChange(value);
      }
    });
  };
  return $$.connect([$$activated, $$invoiceTypes, $$invoice], valueFunc);
}();

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
