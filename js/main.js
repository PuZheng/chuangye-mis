import $$ from 'slot';
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
       R.toPairs(queryObj).filter(p => p[1]).map(p => p.join('=')).join('&'));
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
  $$.init({
    debug: false
  });
  next();
});

page('/login', function () {
  if (!accountStore.user) {
    mount(loginApp.page);
  } else {
    page('/');
  }
});

page('/invoice/:id?', loginRequired, _could('edit.invoice.object'), _setupNavBar('invoice'), function (ctx) {
  currentApp = invoiceObjectApp;
  mount(currentApp.page);
  currentApp.init(ctx.params.id);
});

page('/invoice-list', loginRequired, _could('view.invoice.list'), _setupNavBar('invoice'), function () {
  currentApp = invoiceListApp;
  mount(currentApp.page);
  currentApp.init();
});

var voucherList = function voucherList() {
  currentApp = voucherListApp;
  mount(currentApp.page);
  currentApp.init();
};

page('/voucher-list', loginRequired, 
     _could('view.voucher.list'), _setupNavBar('voucher'),
     voucherList);

var departmentList = function () {
  currentApp = departmentListApp;
  mount(currentApp.page);
  currentApp.init();
};

page(
  '/department-list', loginRequired, _could('edit.department'),
  _setupNavBar('department'), departmentList
);

var department = function () {
  currentApp = departmentApp;  
  mount(currentApp.page);
};

page('/department', loginRequired, 
    _could('edit.department'), _setupNavBar('department'),
    department);

page('/voucher/:id?', loginRequired, _could('edit.voucher.object'), _setupNavBar('voucher'), function (ctx) {
  currentApp = voucherObjectApp;
  mount(currentApp.page);
  currentApp.init(ctx.params.id);
});

let tenantList = function () {
  currentApp = tenantListApp;
  mount(currentApp.page);
  currentApp.init();
};

page('/tenant-list', 
     loginRequired, 
     _could('view.tenant.list'), 
     _setupNavBar('tenant'), tenantList);

let tenantObject = function (ctx) {
  currentApp = tenantObjectApp;
  mount(currentApp.page);
  currentApp.init(ctx.params.id);
};

page('/tenant/:id?', loginRequired,
    _could('edit.tenant.object'),
    _setupNavBar('tenant'), tenantObject);

// page('/charge-bill/:id?', function (ctx) {
//   currentApp = chargeBillApp;
//   mount(chargeBillApp.makePage());
//   app.$$loading.val(true);
//   chargeBillStore.get(ctx.params.id).then(function (chargeBill) {
//     mount(chargeBillApp.makePage(chargeBill));
//     app.$$loading.val(false);
//   });
// });

var settings = function () {
  currentApp = settingsApp;
  mount(currentApp.page);
  currentApp.init();
};

page('/settings', loginRequired, _setupNavBar('settings'), 
      _could('edit.settings'), settings);

var meterList = function () {
  currentApp = meterListApp;
  mount(currentApp.page);
  currentApp.init();
};

page(
  '/meter-list', loginRequired, 
  _setupNavBar('meter'),
  _could('edit.meter'), meterList
);

var accountTerms = function () {
  currentApp = accountTermApp;
  mount(currentApp.page);
  currentApp.init();
};

page(
  '/account-term-list', loginRequired,
  _setupNavBar('account_term'),
  _could('edit.account_term'), accountTerms
);

var meter = function (ctx) {
  currentApp = meterObjectApp;
  mount(currentApp.page);
  currentApp.init(ctx.params.id);
};

page(
  '/meter/:id?', loginRequired,
  _setupNavBar('meter'),
  _could('edit.meter'), meter
);

var invoiceTypeList = function () {
  currentApp = invoiceTypeListApp;
  mount(currentApp.page);
  currentApp.init();
};

page(
  '/invoice-type-list', loginRequired, 
  _setupNavBar('invoice_type'),
  _could('edit.invoice_type'), invoiceTypeList
);

var useWith = function (app) {
  return function (ctx) {
    currentApp = app;
    mount(app.page);
    app.init(ctx);
  };
};

var enableSlotDebug = function (ctx, next) {
  $$.init({ debug: true });
  next();
};

page(
  '/invoice-type/:id?', loginRequired,
  _setupNavBar('invoice_type'),
  _could('edit.invoice_type'), enableSlotDebug, useWith(invoiceTypeObjectApp)
);

page(
  '/voucher-subject-list', loginRequired,
  _setupNavBar('voucher_subject'),
  _could('edit.voucher_subject'), useWith(voucherSubjectListApp)
);

page('/', loginRequired, _setupNavBar('home'), function () {
  currentApp = dashboardApp;
  mount(currentApp.page);
});


page(function () {
  mount(notFoundApp.page);
});

page();
