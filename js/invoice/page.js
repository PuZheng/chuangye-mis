/** @jsx html */
import x from '../xx.js';
import * as domDriver from '../dom-driver.js';
import toastr from 'toastr';
import page from 'page';
import { html } from 'snabbdom-jsx';
import form from './form.js';
import { invoiceTypes, loading, invoice, vendors, purchasers, accountTerms } from './data-slots.js';


const view = x.connect(loading, invoice, form, 
                           (loading, invoice, InvoiceForm) => {
  return (
  <div className="ui grid container">
    <div className="row">
      <div className="column">
        <div className="ui top attached blue message">
          <div className="ui header">
            <div className="ui header">{ invoice.id? `编辑发票-${invoice.number}`: '创建新发票' }</div>
          </div>
        </div>
        <div className="ui bottom attached segment">
          <InvoiceForm />
        </div>
      </div>
    </div>
  </div>);
}).setTag('invoice-page');

var container = document.getElementById('main');
var $invoiceTypeDropdown;
var initialized = {};

domDriver.mount(view, container);

export default view;
