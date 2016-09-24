import $$ from 'slot';
import virtualDom from 'virtual-dom';
import page from 'page';
var h = virtualDom.h;
import classNames from './class-names';
import accountStore from './store/account-store';
import principal from './principal';
import R from 'ramda';

export var $$mods = $$({}, 'mods');

export var $$currentMod = $$('home', 'current-module');

var $$home = $$.connect([$$currentMod], function ([currentMod]) {
  return  h('a' + classNames('item', (currentMod === 'home') && 'active'), {
    href: '/',
    onclick() {
      page('/');
      return false;
    }
  }, [
    h('i.fa.fa-home'),
  ]);
});

var $$invoice = $$.connect([$$currentMod, $$mods], function ([currentMod, mods]) {
  return R.ifElse(
    R.prop('viewInvoiceList'),
    () => h('a' + classNames('item', (currentMod === 'invoice') && 'active'), {
      href: '/invoice',
      onclick() {
        page('/invoice-list');
        return false;
      }
    }, '发票模块'),
    R.always('')
  )(mods);
});

var $$store = function () {
  let $$expanded = $$(false, 'expanded');
  let vf = function ([currentMod, mods, expanded]) {
    let classes = classNames(
      'item', 
      (currentMod === 'store.material_notes' || currentMod === 'store.checkbook') && 'active',
      expanded && 'expanded'
    );
    return R.ifElse(
      R.prop('editMaterialNotes'),
      () => h(classes, {
        onmouseover() {
          $$expanded.val(true);
        },
        onmouseout() {
          $$expanded.val(false);
        }
      }, [
        '仓储管理',
        h('i.fa.fa-caret-down'),
        h('.sub.menu', [
          h('a' + classNames(
            'item', (currentMod == 'store.material_notes') && 'active'), {
            onclick(e) {
              e.preventDefault();
              page('/material-note-list');
              $$expanded.val(false);
              return false;
            }
          }, '单据管理'),
          h('a' + classNames(
            'item', (currentMod == 'store.checkbook' && 'active') 
          ), {
            onclick(e) {
              e.preventDefault();
              page('/store-checkbook');
              $$expanded.val(false);
              return false;
            }
          }, '账目'),
        ])
      ]),
      R.always('')
    )(mods);
  };
  return $$.connect([$$currentMod, $$mods, $$expanded], vf);
}();

var $$voucher = $$.connect([$$currentMod, $$mods], function ([currentMod, mods]) {
  return R.ifElse(
    R.prop('viewVoucherList'),
    () => h('a' + classNames('item', (currentMod === 'voucher') && 'active'), {
      href: '/voucher-list',
      onclick() {
        page('/voucher-list');
      }
    }, '凭证模块'),
    R.always('')
  )(mods);
});

var $$department = $$.connect(
  [$$currentMod, $$mods],
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('editDepartment'),
      () => h('a' + classNames('item', (currentMod === 'department') && 'active'), {
        href: '/department-list',
        onclick() {
          page('/department-list');
        }
      }, '车间信息'),
      R.always('')
    )(mods);
  }
);

var $$tenant = $$.connect(
  [$$currentMod, $$mods],
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('viewTenantList'),
      () => h('a' + classNames('item', (currentMod === 'tenant') && 'active'), {
        href: '/tenant-list',
        onclick() {
          page('/tenant-list');
        }
      }, '承包人信息'),
      R.always('')
    )(mods);
  }
);

var $$settings = $$.connect(
  [$$currentMod, $$mods],
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('editSettings'),
      () => h('a' + classNames('item', (currentMod === 'settings') && 'active'), {
        href: '/settings',
        onclick() {
          page('/settings');
        }
      }, '系统设置'),
      R.always('')
    )(mods);
  }
);

var $$meter = $$.connect(
  [$$currentMod, $$mods], 
  function ([currentMod, mods]) {
    
    return R.ifElse(
      R.prop('editMeter'),
      () => h('a' + classNames('item', (currentMod === 'meter') && 'active'), {
        href: '/meter-list',
        onclick() {
          page('/meter-list');
        }
      }, '表设备信息'),
      R.always('')
    )(mods);
  }
);

var $$accountTerm = $$.connect(
  [$$currentMod, $$mods],
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('editAccountTerm'),
      () => h('a' + classNames('item', (currentMod === 'account_term') && 'active'), {
        href: '/account-term-list',
        onclick(e) {
          e.preventDefault();
          page('/account-term-list');
        }
      }, '帐期管理'),
    R.always('')
    )(mods);
  }
);

var $$invoiceType = $$.connect(
  [$$currentMod, $$mods], 
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('editInvoiceType'),
      () => h('a' + classNames('item', (currentMod === 'invoice_type') && 'active'), {
        href: '/invoice-type-list',
        onclick(e) {
          e.preventDefault();
          page('/invoice-type-list');
        }
      }, '发票类型'),
      R.always('')
    )(mods); 
  }
);

var $$voucherSubject = $$.connect(
  [$$currentMod, $$mods], 
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('editVoucherSubject'),
      () => h('a' + classNames('item', (currentMod === 'voucher_subject') && 'active'), {
        href: '/voucher-subject-list',
        onclick(e) {
          e.preventDefault();
          page('/voucher-subject-list');
        }
      }, '凭证项目'),
      R.always('')
    )(mods);
  }
);

var $$user = $$.connect(
  [$$currentMod, $$mods], 
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('editUser'),
      R.always(h('a' + classNames('item', (currentMod === 'user') && 'active'), {
        href: '/user-list',
        onclick(e) {
          e.preventDefault();
          page('/user-list');
        }
      }, '账户管理')),
      R.always('')
    )(mods);
  }
);

var vf = function vf([
  home, invoice, store, voucher, department, tenant, settings, meter, 
  accountTerm, invoiceType, voucherSubject, user
]) {
  return h('.menu.top', [
    home,
    invoice,
    store,
    voucher,
    department,
    tenant,
    settings,
    meter,
    accountTerm,
    invoiceType,
    voucherSubject,
    user,
    R.ifElse(
      R.prop('user'),
      () => h('.right.color-gray', [
        '欢迎',
        h('a.item.c1.username', {
          href: '/profile',
        }, accountStore.user.username),
        h('a.px1', {
          title: '退出',
          href: '/lougout',
          onclick() {
            accountStore.logout().then(function () {
              // refresh means hide, since there's no user
              $$mods.val({});
              page('/login');
            });
            return false;
          }
        }, [
          h('i.fa.fa-sign-out.ca'),
        ]),
      ]),
      R.always('')
    )(accountStore)
  ].filter(R.identity));
};

export var $$navBar = $$.connect(
  [$$home, $$invoice, $$store, $$voucher, $$department, $$tenant, 
    $$settings, $$meter, $$accountTerm, $$invoiceType, $$voucherSubject, $$user, $$currentMod, $$mods], 
  vf, 
  'nav-bar'
);

export var navBar = {
  $$view: $$navBar,
};

export var setupNavBar = function (mod) {
  if (R.isEmpty($$mods.val())) {
    return principal
    .could('view.invoice.list')
    .could('view.voucher.list')
    .could('edit.department')
    .could('view.tenant.list')
    .could('edit.settings')
    .could('edit.meter')
    .could('edit.account_term')
    .could('edit.invoice_type')
    .could('edit.voucher_subject')
    .could('edit.user')
    .could('edit.material_notes')
    .then(function (
      viewInvoiceList, viewVoucherList, editDepartment,
      viewTenantList, editSettings, editMeter,
      editAccountTerm, editInvoiceType, editVoucherSubject,
      editUser, editMaterialNotes
    ) {
      $$.update(
        [$$mods, {
          viewInvoiceList,
          viewVoucherList,
          editDepartment,
          viewTenantList,
          editSettings,
          editMeter,
          editAccountTerm,
          editInvoiceType,
          editVoucherSubject,
          editUser,
          editMaterialNotes,
        }],
        [$$currentMod, mod]
      );
    });
  }
  $$currentMod.val(mod);
  return Promise.resolve();
};
