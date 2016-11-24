import page from 'page';
import invoiceObjectApp from './invoice/object-app';
import invoiceListApp from './invoice/list-app';
import voucherListApp from './voucher/list-app';
import voucherObjectApp from './voucher/object-app';
import loginApp from './login/app';
import dashboardApp from './dashboard/app';
import departmentListApp from './department/list-app';
import departmentApp from './department/object-app';
import meterListApp from './meter/list-app';
import meterObjectApp from './meter/object-app';
import meterTypeListApp from './meter-type/list-app';
import meterTypeObjectApp from './meter-type/object-app';
import accountStore from 'store/account-store';
import tenantListApp from './tenant/list-app';
import tenantObjectApp from './tenant/object-app';
import settingsApp from './settings/app.js';
import R from 'ramda';
import mount from './mount';
import { navBar, setupNavBar } from './nav-bar';
import toast from './toast';
import overlay from './overlay';
import { could } from './principal';
import qs from 'query-string';
import $$queryObj from './query-obj';
import unauthorizedApp from './unauthorized-app/index.jsx';
import notFoundApp from './not-found-app/index.jsx';
import accountTermApp from './account-term-app/index';
import invoiceTypeListApp from './invoice-type/list-app';
import invoiceTypeObjectApp from './invoice-type/object-app';
import voucherSubjectListApp from './voucher-subject/list-app';
import voucherSubjectObjectApp from './voucher-subject/object-app';
import userListApp from './user/list-app';
import userObjectApp from './user/object-app';
import storeOrderListApp from './store/order/list-app';
import storeOrderObjectApp from './store/order/object-app';
import chargeBillApp from './charge-bill/';
import storeSubjectListApp from './store-subject/list-app';
import storeSubjectObjectApp from './store-subject/object-app';

var useWith = function useWith(app) {
  return function (ctx) {
    currentApp = app;
    mount(app.page);
    app.init && app.init(ctx);
  };
};

var currentApp;

window.onbeforeunload = function (e) {
  if (currentApp && currentApp.dirty) {
    var dialogText = '你已经作出了修改，加载页面将丢失数据, 是否重新加载页面?';
    e.returnValue = dialogText;
    return dialogText;
  }
};

mount(navBar, '#nav-bar');
mount(toast.page, '#toast');
mount(overlay.page, '#overlay');

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
        page('/unauthorized');
        return;
      }
      next();
    });
  };
};

page('/unauthorized', function () {
  mount(unauthorizedApp.page);
});

var goto = function (queryObj) {
  page(location.pathname + '?' +
       R.toPairs(queryObj).filter(it => it[1] !== void 0)
  .map(p => p.join('=')).join('&'));
};

page(function parseQuery(ctx, next) {
  ctx.query = qs.parse(ctx.querystring);
  $$queryObj.offChange(goto);
  $$queryObj.val(ctx.query);
  // note!!! change only after $$queryObj set its value
  $$queryObj.change(goto);
  next();
});

page.exit(function (ctx, next) {
  if (currentApp && currentApp.dirty) {
    if (confirm('你已经作出了修改，退出页面将丢失数据, 是否确认退出?')) {
      next();
    }
    ctx.handled = false;
    return;
  }
  next();
});

page('/login', function () {
  if (!accountStore.user) {
    mount(loginApp.page);
  } else {
    page('/');
  }
});

page('/invoice/:id?', loginRequired, _could('edit.invoice.object'),
     _setupNavBar('invoice'), useWith(invoiceObjectApp));

page('/invoice-list', loginRequired, _could('view.invoice.list'),
     _setupNavBar('invoice'), useWith(invoiceListApp));

page(
  '/voucher-list', loginRequired,
  _could('view.voucher.list'), _setupNavBar('voucher'),
  useWith(voucherListApp)
);

page(
  '/department-list', loginRequired, _could('edit.department'),
  _setupNavBar('department'), useWith(departmentListApp)
);

page(
  '/department', loginRequired,
    _could('edit.department'), _setupNavBar('department'),
    useWith(departmentApp)
);

page(
  '/voucher/:id?', loginRequired, _could('edit.voucher.object'),
     _setupNavBar('voucher'), useWith(voucherObjectApp)
);

page('/tenant-list',
     loginRequired,
     _could('view.tenant.list'),
     _setupNavBar('tenant'), useWith(tenantListApp));

page('/tenant/:id?', loginRequired,
    _could('edit.tenant.object'),
    _setupNavBar('tenant'), useWith(tenantObjectApp));

page('/charge-bill/:accountTermName', loginRequired,
    _could('edit.charge_bill'),
    _setupNavBar('charge_bill'), useWith(chargeBillApp));

page('/settings', loginRequired, _setupNavBar('settings'),
      _could('edit.settings'), useWith(settingsApp));

page(
  '/meter-list', loginRequired,
  _setupNavBar('meter.meter'),
  _could('edit.meter'), useWith(meterListApp)
);

page(
  '/account-term-list', loginRequired,
  _setupNavBar('account_term'),
  _could('edit.account_term'), useWith(accountTermApp)
);

page(
  '/meter/:id?', loginRequired,
  _setupNavBar('meter.meter'),
  _could('edit.meter'), useWith(meterObjectApp)
);

page(
  '/meter-type-list', loginRequired,
  _setupNavBar('meter.meter_type'),
  _could('edit.meter_type'), useWith(meterTypeListApp)
);

page(
  '/meter-type/:id?', loginRequired,
  _setupNavBar('meter.meter_type'),
  _could('edit.meter_type'), useWith(meterTypeObjectApp)
);

page(
  '/invoice-type-list', loginRequired,
  _setupNavBar('invoice_type'),
  _could('edit.invoice_type'), useWith(invoiceTypeListApp)
);


page(
  '/invoice-type/:id?', loginRequired,
  _setupNavBar('invoice_type'),
  _could('edit.invoice_type'), useWith(invoiceTypeObjectApp)
);

page(
  '/voucher-subject-list', loginRequired,
  _setupNavBar('voucher_subject'),
  _could('edit.voucher_subject'), useWith(voucherSubjectListApp)
);

page(
  '/voucher-subject/:id?', loginRequired,
  _setupNavBar('voucher_subject'),
  _could('edit.voucher_subject'), useWith(voucherSubjectObjectApp)
);

page(
  '/user-list', loginRequired,
  _setupNavBar('user'),
  _could('edit.user'), useWith(userListApp)
);

page(
  '/user/:id?', loginRequired,
  _setupNavBar('user'),
  _could('edit.user'), useWith(userObjectApp)
);

page(
  '/store-order-list', loginRequired,
  _setupNavBar('store.order'),
  _could('manage.store'), function (ctx, next) {
    if (!ctx.query.direction) {
      page('/store-order-list?type=原材料&direction=入库');
      return;
    }
    next();
  }, useWith(storeOrderListApp)
);

page(
  '/store-order/:id?', loginRequired,
  _setupNavBar('store.order'),
  _could('manage.store'), useWith(storeOrderObjectApp)
);

page(
  '/store-subject-list', loginRequired,
  _setupNavBar('store_subject'),
  _could('edit.store_subject'), useWith(storeSubjectListApp)
);

page(
  '/store-subject/:id?', loginRequired,
  _setupNavBar('store_subject'),
  _could('edit.store_subject'), useWith(storeSubjectObjectApp)
);

page('/', loginRequired, _setupNavBar('home'), function () {
  currentApp = dashboardApp;
  mount(currentApp.page);
});


page(function () {
  mount(notFoundApp.page);
});


page();
