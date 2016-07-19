import x from './xx.js';
import * as domDriver from './dom-driver.js';
import pageTpl from './template/invoice.ejs';
import spuFormTpl from './template/invoice-form.ejs';
import moment from 'moment';
import toastr from 'toastr';
import page from 'page';

export const invoiceTypes = x([]).tag('invoiceTypes');
export const loading = x(false).tag('loading');
export const invoice = x({}).tag('invoice');
export const vendors = x([]).tag('vendors');
export const purchasers = x([]).tag('purchasers');
export const accountTerms = x([]).tag('accountTerms');

export const invoiceForm = x.connect(
  loading, invoiceTypes, invoice, vendors, purchasers, accountTerms,
  function (loading, invoiceTypes, invoice, 
            vendors, 
            purchasers, accountTerms) {
  return ejs.render(spuFormTpl, {
    loading,
    invoiceTypes,
    invoice,
    vendors,
    purchasers,
    accountTerms,
    moment,
  });
}).tag('invoiceForm');
  
export const view = x.connect(loading, invoiceForm, 
                           (loading, invoiceForm) => {
  return ejs.render(pageTpl, {
    invoiceForm
  });
}).tag('invoicePage');

var container = document.getElementById('main');
var $invoiceTypeDropdown;

domDriver.mount(view, container, (node) => {

  var $node = $(node);
  $node.find('.ui.form').off('submit').submit(function () {
    loading(true);
    setTimeout(function () {
      loading(false);
      toastr.options.positionClass = "toast-bottom-center";
      toastr.options.timeOut = 1000;
      toastr.success('创建成功!');
      page('invoice/1');
    }, 500);
    return false;
  });
  $node.find('[name=invoiceType].ui.dropdown').dropdown({
    onChange: function (value, text, $choice) {
      invoice(Object.assign(invoice(), {
        invoiceTypeId: value,
      }));
      loading(true);
      setTimeout(function () {
        x.update(
          [loading, false],
          [vendors, [
            {id: 11, name: "张三"},
            {id: 22, name: "外部客户1"}
          ]], 
          [purchasers, [
            {id: 1, name: "厂部"},
            {id: 2, name: "外部客户1"}
          ]]
        );
      }, 500);
    }
  });
  $node.find('[name=accountTerm].ui.dropdown').dropdown({
    onChange: function (value, text, $choice) {
      invoice(Object.assign(invoice(), {
        accountTermId: value,
      }));
    }
  });
  $node.find('[name=vendor].ui.dropdown').dropdown({
    onChange: function (value, text, $choice) {
      invoice(Object.assign(invoice(), {
        vendorId: value,
      }));
    }
  });
  $node.find('[name=purchaser].ui.dropdown').dropdown({
    onChange: function (value, text, $choice) {
      invoice(Object.assign(invoice(), {
        purchaserId: value,
      }));
    }
  });
  $node.find('.is-vat.ui.checkbox').checkbox({
    onChecked: function () {
      invoice(Object.assign(invoice(), {
        isVAT: true, 
      }));
    },
    onUnchecked: function () {
      invoice(Object.assign(invoice(), {
        isVAT: false, 
      }));
    }
  });
  $node.find('[name=date]').change(function (e) {
    invoice(Object.assign(invoice(), {
      date: this.value,
    }));
  });
});
