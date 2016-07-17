import x from './xx.js';
import * as domDriver from './dom-driver.js';
import pageTpl from './template/invoice.ejs';
import spuFormTpl from './template/invoice-form.ejs';

export const loading = x('loading');
export const invoice = x('invoice');
export const vendorCandidates = x('vendorCandidates');
export const purchaserCandidates = x('purchaserCandidates');
export const accountTerms = x('accountTerms');
export const subjects = x('subjects');

const invoiceForm = x.connect(
  invoice, vendorCandidates, purchaserCandidates, accountTerms, subjects,
  function (invoice, vendorCandidates, 
            purchaserCandidates, accountTerms, subjects) {
  return ejs.render(spuFormTpl, {
    invoice,
    vendorCandidates,
    purchaserCandidates,
    accountTerms,
    subjects
  });
}).tag('invoiceForm');
  
export const view = x.connect(loading, invoiceForm, 
                           (loading, invoiceForm) => {
  return ejs.render(pageTpl, {
    invoiceForm
  });
}).tag('invoicePage');

var container = document.getElementById('main');
domDriver.mount(view, container, (node) => {
  $(node).find('.ui.dropdown').dropdown();
});
