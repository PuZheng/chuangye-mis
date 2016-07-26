import moment from 'moment';
import {invoice, invoiceTypes, loading, vendors, purchasers, accountTerms, selectedInvoiceType} from './data-slots.js';
import x from '../xx.js';
import R from 'ramda';
import tmpl from './form.ejs';
import once from 'once';
import page from 'page';
import invoiceStore from '../store/invoice-store.js';
import entityStore from '../store/entity-store.js';
import materialSubjectStore from '../store/material-subject-store.js';
import materialsEditor from './materials-editor.js';

const errors = x({}, 'invoice-form-errors');

function invoiceFormValueFunc(
  errors, loading, invoiceTypes, 
  invoice, vendors, purchasers, 
  accountTerms, selectedInvoiceType, materialsEditor
) {
  return ejs.render(tmpl, {
    self: this,
    errors,
    loading,
    invoiceTypes,
    invoice,
    vendors,
    purchasers,
    accountTerms,
    moment,
    selectedInvoiceType,
    materialsEditor,
  });
}

const validate = function (invoice) {
  return Promise.resolve(invoice);
};



var bindEvents = once(function (node) {
  let $node = $(node);

  $node.find('[name=date]').change(function (e) {
    invoice.patch({
      date: this.value,
    });
  });
  $node.find('[name=notes]').change(function (e) {
    invoice.patch({
      notes: this.value,
    });
  });
  $node.find('[name=number]').change(function (e) {
    invoice.patch({
      number: this.value,
    });
  });
  $node.submit(function (e) {
    validate(invoice.val()).then(function () {
      loading.inc();
      invoiceStore.save(invoice.val()).then(function (id) {
        loading.dec();
        page('/invoice/' + id);
      });
    }).catch(errors.val);
    return false;
  });
});

const onInvoiceTypeChange = function (value, text, $choice) {
  value = parseInt(value);
  loading.inc();
  // find the corresponding invoice type
  var invoiceType = R.find(R.propEq('id', value))(invoiceTypes.val());
  Promise.all([
    invoiceType.vendorType?  entityStore.fetchList({
      type: invoiceType.vendorType
    }): [],
    invoiceType.purchaserType?  entityStore.fetchList({
      type: invoiceType.purchaserType,
    }): [],
    invoiceType.materialType? materialSubjectStore.fetchList({ type: invoiceType.materialType }): [],
  ]).then(function ([vendorsData, purchasersData, materialSubjects]) {
    x.update(
      [loading, loading.val() - 1],
      [invoice, Object.assign(invoice.val(), {
        invoiceTypeId: value,
        isVAT: invoiceType.isVAT,
      })],
      [selectedInvoiceType, invoiceType],
      [vendors, vendorsData],
      [purchasers, purchasersData],
      [materialsEditor.materialSubjects, materialSubjects]
    );
  });
};

// dropdown must be initialized each time, since
// semantic altered dom
var initDropdowns = function (node) {
  let $node = $(node);
  $node.find('[name=invoiceType].ui.dropdown').dropdown({
    onChange: onInvoiceTypeChange, 
  });
  $node.find('[name=accountTerm]').dropdown({
    onChange: function (value, text, $choice) {
      invoice.patch({
        accountTermId: value,
      });
    }
  });
  $node.find('[name=vendor].ui.dropdown').dropdown({
    onChange: function (value, text, $choice) {
      invoice.patch({
        vendorId: value,
      });
    }
  });
  $node.find('[name=purchaser].ui.dropdown').dropdown({
    onChange: function (value, text, $choice) {
      invoice.patch({
        purchaserId: value,
      });
    }
  });
};

export default {
  view: x.connect(
    [errors, loading, invoiceTypes, invoice, vendors, purchasers, accountTerms, selectedInvoiceType, 
      materialsEditor.view],
    invoiceFormValueFunc, 
    'invoice-form'),
  config: function (node) {
    bindEvents(node);
    initDropdowns(node);
    let materialsEditorEl = node.querySelector('#' + materialsEditor.view.token);
    materialsEditorEl && materialsEditor.config(materialsEditorEl);
  },
  performInvoiceTypeSelection: function () {
    onInvoiceTypeChange(invoice.val().invoiceTypeId);
  },
};
