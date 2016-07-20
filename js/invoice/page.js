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
}).tag('invoice-page');

var container = document.getElementById('main');
var $invoiceTypeDropdown;
var initialized = {};

domDriver.mount(view, container, (node) => {
  // var $node = $(node);
  // $node.find('.ui.form').off('submit').submit(function () {
  //   loading(true);
  //   setTimeout(function () {
  //     loading(false);
  //     toastr.options.positionClass = "toast-bottom-center";
  //     toastr.options.timeOut = 1000;
  //     toastr.success('创建成功!');
  //     page('invoice/1');
  //   }, 500);
  //   return false;
  // });
  // $node.find('[name=invoiceType].ui.dropdown').dropdown({
  //   onChange: function (value, text, $choice) {
  //     invoice(Object.assign(invoice(), {
  //       invoiceTypeId: value,
  //     }));
  //     loading(true);
  //     setTimeout(function () {
  //       x.update(
  //         [loading, false],
  //         [vendors, [
  //           {id: 11, name: "张三"},
  //           {id: 22, name: "外部客户1"}
  //         ]], 
  //         [purchasers, [
  //           {id: 1, name: "厂部"},
  //           {id: 2, name: "外部客户1"}
  //         ]]
  //       );
  //     }, 500);
  //   }
  // });
  // $node.find('[name=accountTerm].ui.dropdown').dropdown({
  //   onChange: function (value, text, $choice) {
  //     invoice(Object.assign(invoice(), {
  //       accountTermId: value,
  //     }));
  //   }
  // });
  // $node.find('[name=vendor].ui.dropdown').dropdown({
  //   onChange: function (value, text, $choice) {
  //     invoice(Object.assign(invoice(), {
  //       vendorId: value,
  //     }));
  //   }
  // });
  // $node.find('[name=purchaser].ui.dropdown').dropdown({
  //   onChange: function (value, text, $choice) {
  //     invoice(Object.assign(invoice(), {
  //       purchaserId: value,
  //     }));
  //   }
  // });
  // $node.find('.is-vat.ui.checkbox').checkbox({
  //   onChecked: function () {
  //     invoice(Object.assign(invoice(), {
  //       isVAT: true, 
  //     }));
  //   },
  //   onUnchecked: function () {
  //     invoice(Object.assign(invoice(), {
  //       isVAT: false, 
  //     }));
  //   }
  // });
  // if (!initialized['$number']) {
  //   initialized['$number'] = $node.find('[name=number]').change(function (e) {
  //     invoice(Object.assign(invoice(), {
  //       number: this.value,
  //     }));
  //   });
  // }
  // $node.find('[name=date]').change(function (e) {
  //   invoice(Object.assign(invoice(), {
  //     date: this.value,
  //   }));
  // });
  // $node.find('[name=notes]').change(function (e) {
  //   invoice(Object.assign(invoice(), {
  //     notes: this.value,
  //   }));
  // });
});

export default view;
