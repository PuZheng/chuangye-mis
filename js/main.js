import moment from 'moment';
import page from 'page';
import invoiceObjectApp from './invoice/object-app.js';
import invoiceListApp from './invoice/list-app.js';
import voucherObjectApp from './voucher/object-app.js';
import loginApp from './login/app.js';
import dashboardApp from './dashboard/app.js';
import chargeBillApp from './charge-bill/app.js';
import x from './xx.js';
import invoiceTypeStore from './store/invoice-type-store.js';
import accountTermStore from './store/account-term-store.js';
import invoiceStore from './store/invoice-store.js';
import voucherTypeStore from './store/voucher-type-store.js';
import voucherSubjectStore from './store/voucher-subject-store.js';
import voucherStore from './store/voucher-store.js';
import chargeBillStore from './store/charge-bill-store.js';
import accountStore from './store/account-store.js';
import R from 'ramda';
import entityStore from './store/entity-store.js';
import mount from './mount.js';
import { navBar, setupNavBar } from './nav-bar.js';
import toast from './toast';
import { could } from './principal';
import qs from 'query-string';
import $$queryObj from './query-obj';

x.init({ debug: true });

mount(navBar, '#nav-bar');
mount(toast.page, '#toast');

var _setupNavBar = function (mod) {
  return function (ctx, next) {
    setupNavBar(mod).then(next);
  };
};

var loginRequired = function (ctx, next) {
  if (!accountStore.user) {
    return page('/login');
  }
  next();
};

var _could = function (request) {
  return function (ctx, next) {
    could(request).then(function (ok) {
      if (!ok) {
        page('/unauthorized.html');
        return;
      }
      next();
    });
  };
};
var goto = function (queryObj) {
  page(location.pathname + '?' + 
       R.toPairs(queryObj).map(p => p.join('=')).join('&'));
};

page(function parseQuery(ctx, next) {
  ctx.query = qs.parse(ctx.querystring);
  $$queryObj.offChange(goto);
  console.log($$queryObj.onChangeCbs);
  $$queryObj.val(ctx.query);
  // note!!! change only after $$queryObj set its value
  $$queryObj.change(goto);
  next();
});

page('/login', function (ctx, next) {
  if (!accountStore.user) {
    mount(loginApp.page);
  } else {
    page('/');
  }
});

page('/invoice/:id?', loginRequired, _could('edit.invoice.object'), _setupNavBar('invoice'), function (ctx, next) {
  let app = invoiceObjectApp;
  mount(invoiceObjectApp.page);
  let promises = [
    invoiceTypeStore.list, 
    accountTermStore.list,
    ctx.params.id? invoiceStore.get(ctx.params.id): {
      date: moment().format('YYYY-MM-DD')
    },
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

page('/invoice-list', loginRequired, _could('view.invoice.list'), _setupNavBar('invoice'), function (ctx, next) {
  let app = invoiceListApp;
  mount(app.page);
  app.$$loading.toggle();
  Promise.all([
    invoiceStore.fetchList(ctx.query),
    invoiceTypeStore.list,
  ]).then(function ([data, invoiceTypes]) {
    x.update(
      [app.$$loading, false],
      [app.$$list, data.data],
      [app.$$totalCnt, data.totalCnt],
      [app.$$invoiceTypes, invoiceTypes]
    );
  });
});

page('/voucher/:id?', loginRequired, _could('edit.voucher.object'), _setupNavBar('voucher'), function (ctx, next) {
  let app = voucherObjectApp;
  mount(voucherObjectApp.page);
  app.$$loading.val(true);
  let promises = [
    voucherTypeStore.list,
    voucherSubjectStore.list,
    ctx.params.id? voucherStore.get(ctx.params.id): {
      date: moment().format('YYYY-MM-DD')
    }
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

page('/', loginRequired, _setupNavBar('home'), function (ctx, next) {
  let app = dashboardApp;
  mount(dashboardApp.page);
});

page();
