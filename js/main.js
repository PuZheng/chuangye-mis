import page from 'page';
import invoiceApp from './invoice/main.js';
import x from './xx.js';
import invoiceTypeStore from './store/invoice-type-store.js';
import accountTermStore from './store/account-term-store.js';
import invoiceStore from './store/invoice-store.js';
import R from 'ramda';
import entityStore from './store/entity-store.js';

x.init({ debug: true });


page('/invoice/:id?', function (ctx, next) {
  var app = invoiceApp;
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

page();
