import page from 'page';
import invoiceObjectApp from './invoice/object-app.js';
import voucherObjectApp from './voucher/object-app.js';
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

x.init({ debug: true });

page('/invoice/:id?', function (ctx, next) {
  var app = invoiceObjectApp;
  var promises = [
    invoiceTypeStore.list, 
    accountTermStore.list,
    ctx.params.id? invoiceStore.get(ctx.params.id): {},
  ];
  app.$$loading.inc();
  Promise.all(promises).then(function ([invoiceTypes, accountTerms, invoice]) {
    var args = [
      [app.$$invoiceTypes, invoiceTypes],
      [app.$$accountTerms, accountTerms],
      [app.$$loading, 0],
      [app.$$invoice, invoice]
    ];
    x.update(...args);
  });
});

page('/voucher/:id?', function (ctx, next) {
  var app = voucherObjectApp;
  app.$$loading.val(true);
  var promises = [
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
  var app = chargeBillApp;
  app.$$loading.val(true);
  chargeBillStore.get(ctx.params.id).then(function ({ def, data }) {
    x.update(
      [app.$$loading, false],
      [app.$$chargeBillDef, def],
      [app.$$chargeBillData, data]
    );
  });
});

page();
