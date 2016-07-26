import page from 'page';
import invoiceObjectApp from './invoice/object-app.js';
import voucherObjectApp from './voucher/object-app.js';
import x from './xx.js';
import invoiceTypeStore from './store/invoice-type-store.js';
import accountTermStore from './store/account-term-store.js';
import invoiceStore from './store/invoice-store.js';
import voucherTypeStore from './store/voucher-type-store.js';
import voucherSubjectStore from './store/voucher-subject-store.js';
import R from 'ramda';
import entityStore from './store/entity-store.js';

x.init({ debug: true });


page('/invoice/:id?', function (ctx, next) {
  var app = invoiceObjectApp;
  var promises = [
    invoiceTypeStore.list, 
    accountTermStore.list,
  ];
  if (ctx.params.id) {
    promises.push(invoiceStore.get(ctx.params.id));
  }
  app.loading.inc();
  Promise.all(promises).then(function ([invoiceTypes, accountTerms, invoice]) {
    var args = [
      [app.invoiceTypes, invoiceTypes],
      [app.accountTerms, accountTerms],
      [app.loading, 0],
    ];
    if (ctx.params.id) {
      args.push([app.invoice, invoice]);
    } 
    x.update(...args);
    // ask to dropdown to perform on change event
    if (ctx.params.id) {
      app.page.performInvoiceTypeSelection();
    }
  });
});

page('/voucher/:id?', function (ctx, next) {
  var app = voucherObjectApp;
  app.loadingSlot.val(true);
  Promise.all([
    voucherTypeStore.list,
    voucherSubjectStore.list,
  ]).then(function ([voucherTypes, voucherSubjects]) {
      x.update(
        [app.voucherTypesSlot, voucherTypes],
        [app.loadingSlot, false],
        [app.voucherSubjectsSlot, voucherSubjects]
      );
    });
  app.viewSlot.refresh();
});

page();
