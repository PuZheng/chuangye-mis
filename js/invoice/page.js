/** @jsx html */
import x from '../xx.js';
import domDriver from '../dom-driver.js';
import toastr from 'toastr';
import page from 'page';
import form from './form.js';
import { $$invoiceTypes, $$loading, $$invoice, $$vendors, $$purchasers, $$accountTerms } from './data-slots.js';
import morphdom from 'morphdom';
import tmpl from './page.ejs';


const view = x.connect(
  [$$loading, $$invoice, form.view], 
  function (loading, invoice, form) {
    return ejs.render(tmpl, {
      self: this,
      loading, 
      invoice,
      form, 
    });
  }, 'invoice-page');

var container = document.getElementById('main');
var $invoiceTypeDropdown;
var initialized = {};

domDriver.mount(view, container, function (node) {
  form.config(node.querySelector('#' + form.view.token));
});

export default {
  view,
};
