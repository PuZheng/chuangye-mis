import x from './xx.js';
import * as domDriver from './dom-driver.js';
import pageTpl from './template/invoice.ejs';
import spuFormTpl from './template/invoice-form.ejs';

export const loading = x().tag('loading');
export const invoice = x().tag('invoice');
export const vendorCandidates = x().tag('vendorCandidates');
export const purchaserCandidates = x().tag('purchaserCandidates');
export const accountTerms = x().tag('accountTerms');

const invoiceForm = x.connect(
  invoice, vendorCandidates, purchaserCandidates, accountTerms,
  function (invoice, vendorCandidates, 
            purchaserCandidates, accountTerms) {
  return ejs.render(spuFormTpl, {
    invoice,
    vendorCandidates,
    purchaserCandidates,
    accountTerms,
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
