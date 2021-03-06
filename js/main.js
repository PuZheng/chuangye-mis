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
import authStore from 'store/auth-store';
import tenantListApp from './tenant/list-app';
import tenantObjectApp from './tenant/object-app';
import settingsApp from './settings/app.js';
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
import partnerListApp from './partner/list-app';
import partnerObjectApp from './partner/object-app';
import meterReadingsApp from './meter-readings/index';
import paymentRecordListApp from './payment-record/list-app';
import config from './config';
import object2qs from './utils/object2qs';
import accountTermStore from './store/account-term-store';
import chemicalSupplierListApp from './chemical-supplier/list-app';
import chemicalSupplierObjectApp from './chemical-supplier/object-app';
import plantListApp from './plant/list-app';
import plantObjectApp from './plant/object-app';

var useWith = function useWith(app) {
  return function (ctx) {
    currentApp = app;
    mount(app.page);
    app.init && app.init(ctx);
  };
};

var assurePageNPageSize = function assurePageNPageSize(mod) {
  return function (ctx, next) {
    let { page: page_, page_size } = ctx.query;
    if (!(page_ && page_size)) {
      page(ctx.pathname + '?' + object2qs(Object.assign(ctx.query, {
        page: 1,
        page_size: config.getPageSize(mod || ''),
      })));
      return;
    }
    next();
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
  if (!authStore.user) {
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
  page(location.pathname + '?' + object2qs(queryObj));
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
    // 确保不会修改location
    ctx.handled = false;
    return;
  }
  next();
});

page('/login', function () {
  if (!authStore.user) {
    mount(loginApp.page);
  } else {
    page('/');
  }
});

page('/invoice/:id?', loginRequired, _could('edit.invoice.object'),
     _setupNavBar('invoice'), useWith(invoiceObjectApp));

page('/invoice-list', loginRequired, _could('view.invoice.list'),
     _setupNavBar('invoice'), assurePageNPageSize('invoice'),
     useWith(invoiceListApp));

page(
  '/voucher-list', loginRequired,
  _could('view.voucher.list'), _setupNavBar('voucher'),
  assurePageNPageSize('voucher'),
  useWith(voucherListApp)
);

page(
  '/department-list', loginRequired, _could('edit.department'),
  _setupNavBar('department'), assurePageNPageSize('department'),
  useWith(departmentListApp)
);

page(
  '/department/:id?', loginRequired,
    _could('edit.department'), _setupNavBar('department'),
    useWith(departmentApp)
);

page(
  '/voucher/:id?', loginRequired, _could('edit.voucher.object'),
     _setupNavBar('voucher'), useWith(voucherObjectApp)
);

page(
  '/tenant-list',
  loginRequired,
  _could('view.tenant.list'),
  _setupNavBar('tenant'),
  assurePageNPageSize('tenant'),
  useWith(tenantListApp)
);

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
  _could('edit.meter'),
  _setupNavBar('meter.meter'),
  assurePageNPageSize('meter.meter'),
  useWith(meterListApp)
);

page(
  '/account-term/:id?', loginRequired,
  _setupNavBar('account_term'),
  _could('edit.account_term'), function (ctx, next) {
    let { id } = ctx.params;
    if (id === void 0) {
      accountTermStore.list.then(function (accountTerms) {
        if (accountTerms && accountTerms.length) {
          page('/account-term/' + accountTerms[0].id);
        }
      });
      return;
    }
    next();
  }, useWith(accountTermApp)
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
  '/meter-readings', loginRequired,
  _setupNavBar('meter.meter_reading'),
  _could('edit.meter_reading'), useWith(meterReadingsApp)
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
  }, assurePageNPageSize('store.order'), useWith(storeOrderListApp)
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

page(
  '/partner-list', loginRequired,
  function (ctx, next) {
    setupNavBar('partner.' + ctx.query.type).then(next);
  },
  _could('edit.partner'),
  assurePageNPageSize('partner'),
  useWith(partnerListApp)
);

page(
  '/partner/:id?', loginRequired,
  function (ctx, next) {
    setupNavBar('partner.' + ctx.query.type).then(next);
  },
  _could('edit.partner'), useWith(partnerObjectApp)
);

page(
  '/payment-record-list',
  loginRequired,
  _setupNavBar('payment_record'),
  _could('edit.payment_record'),
  assurePageNPageSize('payment_record'),
  useWith(paymentRecordListApp)
);

page('/chemical-supplier-list',
  loginRequired,
  _setupNavBar('chemical_supplier'),
  _could('edit.chemical_supplier'),
  assurePageNPageSize('chemial_supplier'),
  useWith(chemicalSupplierListApp)
);

page(
    '/chemical-supplier/:id?',
    loginRequired,
    _setupNavBar('chemical_supplier'),
    _could('edit.chemical_supplier'),
    useWith(chemicalSupplierObjectApp)
);

page('/', loginRequired, _setupNavBar('home'), function () {
  currentApp = dashboardApp;
  mount(currentApp.page);
});

page(
  '/plant-list',
  loginRequired,
  _setupNavBar('plant'),
  _could('edit.plant'),
  assurePageNPageSize('plant'),
  useWith(plantListApp)
);

page(
  '/plant/:id?',
  loginRequired,
  _setupNavBar('plant'),
  _could('edit.plant'),
  useWith(plantObjectApp)
);


page(function () {
  mount(notFoundApp.page);
});

page();
