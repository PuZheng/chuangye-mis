import classNames from 'classnames';
import moment from 'moment';
import {invoice, invoiceTypes, loading, vendors, purchasers, accountTerms} from './data-slots.js';
import x from '../xx.js';
import R from 'ramda';
import tmpl from '../../template/invoice/form.ejs';
import once from 'once';
import page from 'page';
import invoiceStore from '../store/invoice-store.js';
import entityStore from '../store/entity-store.js';

const errors = x({}).setTag('invoice-form-errors');
const selectedInvoiceType = x({}).setTag('invoice-form-selected-invoice-type');

function invoiceFormValueFunc(
  errors, loading, invoiceTypes, 
  invoice, vendors, purchasers, 
  accountTerms, selectedInvoiceType
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
    selectedInvoiceType
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
    let invoice = invoice.val();
    validate(invoice).then(function () {
      loading.inc();
      invoiceStore.save(invoice).then(function (id) {
        loading.dec();
        page('/invoice/' + id);
      });
    }).catch(function (errors) {
      errors.val(errors);
    });
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
  ]).then(function ([vendorsData, purchasersData]) {
    x.update(
      [loading, loading.val() - 1],
      [invoice, Object.assign(invoice.val(), {
        invoiceTypeId: value,
        isVAT: invoiceType.isVAT,
      })],
      [selectedInvoiceType, invoiceType],
      [vendors, vendorsData],
      [purchasers, purchasersData]
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
  errors, loading, invoiceTypes, invoice, vendors, purchasers, accountTerms, selectedInvoiceType,
  invoiceFormValueFunc
  ).setTag('invoice-form'),
  config: function (node) {
    bindEvents(node);
    initDropdowns(node);
  },
  performInvoiceTypeSelection: function () {
    onInvoiceTypeChange(invoice.val().invoiceTypeId);
  },
};
