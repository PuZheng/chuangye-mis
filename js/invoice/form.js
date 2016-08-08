import moment from 'moment';
import {$$invoice, $$invoiceTypes, $$loading, $$vendors, $$purchasers, $$accountTerms, $$selectedInvoiceType} from './data-slots.js';
import x from '../xx.js';
import R from 'ramda';
import once from 'once';
import page from 'page';
import invoiceStore from '../store/invoice-store.js';
import entityStore from '../store/entity-store.js';
import materialSubjectStore from '../store/material-subject-store.js';
// import materialsEditor from './materials-editor.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;
import {dropdown, searchDropdown} from '../dropdown.js';

const $$errors = x({}, 'invoice-form-errors');


$$invoice.change(function (invoice) {
  if (invoice.id && invoice.invoiceTypeId) {
    onInvoiceTypeChange(invoice.invoiceTypeId);
  }
});

var $$invoiceTypeDropdown = function () {
  let $$activated = x(false, 'activated');
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
  return x.connect([$$activated, $$invoiceTypes, $$invoice], valueFunc);
}();

var $$accountTermDropdown = function () {
  let $$activated = x(false, 'activated');
  let valueFunc = function (activated, accountTerms, invoice) {
    return dropdown({
      defaultText: '请选择会计账期',
      options: accountTerms.map(function (t) {
        return {
          value: t.id,
          text: t.name,
        };
      }),
      value: invoice.accountTermId,
      activated: activated,
      onactivate(b) {
        $$activated.val(b);
      },
      onchange(value, option) {
        $$invoice.patch({
          accountTermId: parseInt(value),
        });
      },
    });
  };
  return x.connect([$$activated, $$accountTerms, $$invoice], valueFunc);
}();

var $$vendorsDropdown = function () {
  let $$activated = x(false, 'activated');
  let $$searchText = x('', 'search-text');
  let valueFunc = function (activated, searchText, vendors, invoice) {
    return searchDropdown({
      defaultText: '请选择销售方',
      options: vendors.map( v => ({ value: v.id, text: v.name, abbr: v.abbr }) ),
      activated: activated,
      value: invoice.vendorId,
      onactivate(b) {
        $$activated.val(b);
        $$searchText.val('');
      },
      onchange(value, option) {
        $$invoice.patch({
          vendorId: parseInt(value)
        });
      },
      onsearch(value) {
        $$searchText.val(value);
      },
      searchText,
      match(option, searchText) {
        return ~option.text.indexOf(searchText) || ~option.abbr.indexOf(searchText);
      }
    });
  };
  return x.connect([$$activated, $$searchText, $$vendors, $$invoice], valueFunc);
}();

function invoiceFormValueFunc(
  errors, loading,  
  invoice, purchasers, 
  selectedInvoiceType, invoiceTypeDropdown,
  accountTermDropdown, vendorsDropdown
) {
  let classNames = ['form', 'm1', 'clearfix'];
  loading && classNames.push('loading');
  classNames = classNames.map( c => '.' + c ).join();
  return h('form#invoice-form' + classNames, [
    h('.col.col-6', [
      h('.field.field-inline.field-required', [
        h('label', '发票类型'),
        invoiceTypeDropdown,
      ]),
      h('.field.field-inline', [
        h('label', '发票日期'),
        h('input', {
          type: 'date',
          value: invoice.date? moment(invoice.date): moment().format('YYYY-MM-DD')
        }),
      ]),
      h('.field.field-inline.field-required', [
        h('label', '发票号码'),
        h('input', {
          type: 'text',
          value: invoice.number || '',
        }),
      ]),
      h('.field.field-inline', [
        h('label', '会计帐期'),
        accountTermDropdown,
      ]),
      h('.field.field-inline', [
        h('label', '(实际)销售方'),
        vendorsDropdown, 
      ]),
      h('.field.field-inline', [
        h('label', '(实际)购买方')
      ]),
      h('.field.field-inline', [
        h('input', {
          type: 'checkbox',
        }),
        h('label', '是否是增值税'),
      ]),
      h('.field.field-inline', [
        h('label', '备注'),
        h('textarea', {
          rows: 4,
        })
      ]),
    ]),
    h('.col.col-6', [
      h('.field', [
        h('label', {
          style: {
            display: 'block'
          }
        }, '物料明细'),
      ])
    ])
  ]);
}

const validate = function (invoice) {
  return Promise.resolve(invoice);
};

var bindEvents = once(function (node) {
  let $node = $(node);

  $node.find('[name=date]').change(function (e) {
    $$invoice.patch({
      date: this.value,
    });
  });
  $node.find('[name=notes]').change(function (e) {
    $$invoice.patch({
      notes: this.value,
    });
  });
  $node.find('[name=number]').change(function (e) {
    $$invoice.patch({
      number: this.value,
    });
  });
  $node.submit(function (e) {
    validate($$invoice.val()).then(function () {
      $$loading.inc();
      invoiceStore.save($$invoice.val()).then(function (id) {
        $$loading.dec();
        page('/invoice/' + id);
      });
    }).catch($$errors.val);
    return false;
  });
});

const onInvoiceTypeChange = function (value) {
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
  ]).then(function ([vendorsData, purchasersData, materialSubjects]) {
    x.update(
      [$$loading, $$loading.val() - 1],
      [$$invoice, Object.assign($$invoice.val(), {
        invoiceTypeId: value,
        isVAT: invoiceType.isVAT,
      })],
      [$$selectedInvoiceType, invoiceType],
      [$$vendors, vendorsData],
      [$$purchasers, purchasersData]
      // [materialsEditor.$$materialSubjects, materialSubjects]
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
      $$invoice.patch({
        accountTermId: value,
      });
    }
  });
  $node.find('[name=vendor].ui.dropdown').dropdown({
    onChange: function (value, text, $choice) {
      $$invoice.patch({
        vendorId: value,
      });
    }
  });
  $node.find('[name=purchaser].ui.dropdown').dropdown({
    onChange: function (value, text, $choice) {
      $$invoice.patch({
        purchaserId: value,
      });
    }
  });
};

export default {
  view: x.connect(
    [$$errors, $$loading, $$invoice, $$purchasers, 
      $$selectedInvoiceType, 
      // materialsEditor.$$view, 
      $$invoiceTypeDropdown,
      $$accountTermDropdown,
      $$vendorsDropdown
    ],
    invoiceFormValueFunc, 
    'invoice-form'),
  config: function (node) {
    // bindEvents(node);
    // initDropdowns(node);
    // let materialsEditorEl = node.querySelector('#' + materialsEditor.$$view.token);
    // materialsEditorEl && materialsEditor.config(materialsEditorEl);
  },
};
