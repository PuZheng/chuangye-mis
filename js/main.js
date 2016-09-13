import $$ from 'slot';
import moment from 'moment';
import page from 'page';
import invoiceObjectApp from './invoice/object-app';
import invoiceListApp from './invoice/list-app';
import voucherListApp from './voucher/list-app';
import voucherObjectApp from './voucher/object-app';
import loginApp from './login/app';
import dashboardApp from './dashboard/app';
import chargeBillApp from './charge-bill/app';
import departmentListApp from './department/list-app';
import departmentApp from './department/object-app';
import electricMeterListApp from './electric-meter/list-app';
import electricMeterObjectApp from './electric-meter/object-app';
import invoiceTypeStore from './store/invoice-type-store';
import accountTermStore from './store/account-term-store';
import invoiceStore from './store/invoice-store';
import voucherTypeStore from './store/voucher-type-store';
import voucherSubjectStore from './store/voucher-subject-store';
import voucherStore from './store/voucher-store';
import chargeBillStore from './store/charge-bill-store';
import accountStore from './store/account-store';
import departmentStore from './store/department-store';
import tenantStore from './store/tenant-store';
import settingsStore from './store/settings-store';
import electricMeterStore from './store/electric-meter-store';
import tenantListApp from './tenant/list-app';
import tenantObjectApp from './tenant/object-app';
import settingsApp from './settings/app.js';
import R from 'ramda';
import entityStore from './store/entity-store';
import mount from './mount';
import { navBar, setupNavBar } from './nav-bar';
import toast from './toast';
import overlay from './overlay';
import { could } from './principal';
import qs from 'query-string';
import $$queryObj from './query-obj';

// $$.init({ debug: true });

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
        page('/unauthorized.html');
        return;
      }
      next();
    });
  };
};
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

page('/login', function () {
  if (!accountStore.user) {
    mount(loginApp.page);
  } else {
    page('/');
  }
});

page('/invoice/:id?', loginRequired, _could('edit.invoice.object'), _setupNavBar('invoice'), function (ctx) {
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
    $$.update(...args);
  });
});

page('/invoice-list', loginRequired, _could('view.invoice.list'), _setupNavBar('invoice'), function (ctx) {
  let app = invoiceListApp;
  mount(app.page);
  app.$$loading.toggle();
  Promise.all([
    invoiceStore.fetchList(ctx.query),
    invoiceTypeStore.list,
    accountTermStore.list,
    entityStore.fetchList(),
  ]).then(function ([data, invoiceTypes, accountTerms, entities]) {
    $$.update(
      [app.$$loading, false],
      [app.$$list, data.data],
      [app.$$totalCnt, data.totalCnt],
      [app.$$invoiceTypes, invoiceTypes],
      [app.$$accountTerms, accountTerms],
      [app.$$entities, entities]
    );
  });
});

var voucherList = function voucherList(ctx) {
  var app = voucherListApp;
  mount(app.page);
  app.$$loading.toggle();
  Promise.all([
    voucherStore.fetchList(ctx.query),
    voucherTypeStore.list,
    voucherSubjectStore.list,
    entityStore.fetchList(),
  ]).then(function ([data, voucherTypes, voucherSubjects, entities]) {
    $$.update(
      [app.$$vouchers, data.data],
      [app.$$totalCnt, data.totalCnt],
      [app.$$voucherTypes, voucherTypes],
      [app.$$voucherSubjects, voucherSubjects],
      [app.$$entities, entities],
      [app.$$loading, false]
    );
  });
};

page('/voucher-list', loginRequired, 
     _could('view.voucher.list'), _setupNavBar('voucher'),
     voucherList);

var departmentList = function () {
  var app = departmentListApp;
  mount(app.page);
  app.$$loading.val(true);
  departmentStore.list.then(function (departments) {
    $$.update(
      [app.$$departments, departments],
      [app.$$loading, false]
    );
  });
};

page(
  '/department-list', loginRequired, _could('edit.department'),
  _setupNavBar('department'), departmentList
);

var department = function () {
  var app = departmentApp;  
  mount(app.page);
};

page('/department', loginRequired, 
    _could('edit.department'), _setupNavBar('department'),
    department);

page('/voucher/:id?', loginRequired, _could('edit.voucher.object'), _setupNavBar('voucher'), function (ctx) {
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
    $$.update(
      [app.$$voucherTypes, voucherTypes],
      [app.$$loading, false],
      [app.$$voucherSubjects, voucherSubjects],
      [app.$$voucher, voucher]
    );
  });
});

let tenantList = function (ctx) {
  var app = tenantListApp;
  mount(app.page);
  app.$$loading.toggle();
  tenantStore.fetchList(ctx.query).then(function ({data: tenants, totalCnt}) {
    $$.update(
      [app.$$tenants, tenants],
      [app.$$totalCnt, totalCnt],
      [app.$$loading, false]
    );
  });
};

page('/tenant-list', 
     loginRequired, 
     _could('view.tenant.list'), 
     _setupNavBar('tenant'), tenantList);

let tenantObject = function (ctx) {
  var app = tenantObjectApp;
  mount(app.page);
  app.$$loading.toggle();
  Promise.all([
    departmentStore.list,
    ctx.params.id? tenantStore.get(ctx.params.id): {}
  ])
  .then(function ([departments, tenant]) {
    $$.update(
      [app.$$loading, false],
      [app.$$departments, departments],
      [app.$$tenant, tenant]
    );
  });
};

page('/tenant/:id?', loginRequired,
    _could('edit.tenant.object'),
    _setupNavBar('tenant'), tenantObject);

page('/charge-bill/:id?', function (ctx) {
  let app = chargeBillApp;
  mount(chargeBillApp.makePage());
  app.$$loading.val(true);
  chargeBillStore.get(ctx.params.id).then(function (chargeBill) {
    mount(chargeBillApp.makePage(chargeBill));
    app.$$loading.val(false);
  });
});

var settings = function () {
  let app = settingsApp;
  mount(app.page);
  app.$$loading.toggle();
  settingsStore.list.then(function (settings) {
    $$.update(
      [app.$$loading, false],
      [app.$$settings, settings]
    );
  });
};

page('/settings', loginRequired, _setupNavBar('settings'), 
      _could('edit.settings'), settings);

var electricMeterList = function (ctx) {
  let app = electricMeterListApp;
  mount(app.page);
  app.$$loading.toggle(); 
  electricMeterStore.fetchList(ctx.query)
  .then(function ({totalCnt, data}) {
    $$.update(
      [app.$$loading, false],
      [app.$$list, data],
      [app.$$totalCnt, totalCnt]
    );
  });
};

page(
  '/electric-meter-list', loginRequired, 
  _setupNavBar('electric_meter'),
  _could('edit.electric_meter'), electricMeterList
);

var electricMeter = function () {
  let app = electricMeterObjectApp;
  mount(app.page);
  app.$$loading.toggle();
  Promise.all([
    electricMeterStore.statusList,
    electricMeterStore.fetchList(),
    departmentStore.list,
  ])
  .then(function ([statusList, { data: electricMeters }, departments]) {
    $$.update(
      [app.$$loading, false],
      [app.$$statusList, statusList],
      [app.$$electricMeters, electricMeters],
      [app.$$departments, departments]
    );
  });
};

page(
  '/electric-meter', loginRequired,
  _setupNavBar('electric_meter'),
  _could('edit.electric_meter'), electricMeter
);

page('/', loginRequired, _setupNavBar('home'), function () {
  let app = dashboardApp;
  mount(app.page);
});

page();
