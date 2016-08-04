import page from 'page';
import invoiceObjectApp from './invoice/object-app.js';
import voucherObjectApp from './voucher/object-app.js';
import loginApp from './login/app.js';
import chargeBillApp from './charge-bill/app.js';
import x from './xx.js';
import invoiceTypeStore from './store/invoice-type-store.js';
import accountTermStore from './store/account-term-store.js';
import invoiceStore from './store/invoice-store.js';
import voucherTypeStore from './store/voucher-type-store.js';
import voucherSubjectStore from './store/voucher-subject-store.js';
import voucherStore from './store/voucher-store.js';
import chargeBillStore from './store/charge-bill-store.js';
import R from 'ramda';
import entityStore from './store/entity-store.js';
import mount from './mount.js';

x.init({ debug: true });

page('/login', function (ctx, next) {
  mount(loginApp.page);
});

page('/invoice/:id?', function (ctx, next) {
  let app = invoiceObjectApp;
  let promises = [
    invoiceTypeStore.list, 
    accountTermStore.list,
    ctx.params.id? invoiceStore.get(ctx.params.id): {},
  ];
  app.$$loading.inc();
  Promise.all(promises).then(function ([invoiceTypes, accountTerms, invoice]) {
    let args = [
      [app.$$invoiceTypes, invoiceTypes],
      [app.$$accountTerms, accountTerms],
      [app.$$loading, 0],
      [app.$$invoice, invoice]
    ];
    x.update(...args);
  });
});

page('/voucher/:id?', function (ctx, next) {
  let app = voucherObjectApp;
  app.$$loading.val(true);
  let promises = [
    voucherTypeStore.list,
    voucherSubjectStore.list,
    ctx.params.id? voucherStore.get(ctx.params.id): {}
  ];
  Promise.all(promises).then(function ([voucherTypes, voucherSubjects, voucher]) {
    x.update(
      [app.$$voucherTypes, voucherTypes],
      [app.$$loading, false],
      [app.$$voucherSubjects, voucherSubjects],
      [app.$$voucher, voucher]
    );
  });
});

page('/charge-bill/:id?', function (ctx, next) {
  let app = chargeBillApp;
  mount(chargeBillApp.makePage());
  app.$$loading.val(true);
  chargeBillStore.get(ctx.params.id).then(function (chargeBill) {
    mount(chargeBillApp.makePage(chargeBill));
    app.$$loading.val(false);
  });
});

page();
