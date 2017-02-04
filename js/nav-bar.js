import $$ from 'slot';
import virtualDom from 'virtual-dom';
import page from 'page';
const h = virtualDom.h;
import classNames from './class-names';
import authStore from './store/auth-store';
import principal from './principal';
import R from 'ramda';
import constStore from 'store/const-store';

const $$invoiceStates = $$({}, 'invoice-status');
const $$entityTypes = $$({}, 'entity-types');
const $$PAYMENT_RECORD_STATES = $$({}, 'PAYMENT_RECORD_STATES');
export const $$mods = $$({}, 'mods');
export const $$currentMod = $$('home', 'current-module');

const $$home = $$.connect([$$currentMod], function ([currentMod]) {
  return h('a' + classNames('item', (currentMod === 'home') && 'active'), {
    href: '/',
  }, [
    h('i.fa.fa-home'),
  ]);
});

const $$invoice = $$.connect(
  [$$currentMod, $$mods, $$invoiceStates],
  function ([currentMod, mods, invoiceStates]) {
    return R.ifElse(
      R.prop('viewInvoiceList'),
      () => h(
        'a' + classNames('item', (currentMod === 'invoice') && 'active'), {
          href: '/invoice-list?status=' + invoiceStates.UNAUTHENTICATED,
        }, '发票模块'
      ),
      R.always('')
    )(mods);
  }
);

const $$store = function () {
  let $$expanded = $$(false, 'expanded');
  let vf = function ([currentMod, mods, expanded]) {
    let classes = classNames(
      'item',
      (currentMod === 'store.order' || currentMod === 'store.checkbook') &&
      'active',
      expanded && 'expanded'
    );
    return R.ifElse(
      R.prop('manageStore'),
      () => h(classes, {
        onmouseover() {
          $$expanded.on();
        },
        onmouseout() {
          $$expanded.off();
        }
      }, [
        '仓储管理',
        h('i.fa.fa-caret-down'),
        h('._.sub.menu', [
          function () {
            let classes = classNames('item',
                                     (currentMod == 'store.order') && 'active');

            return h('a' + classes, {
              href: '/store-order-list',
              onclick() {
                $$expanded.off();
              }
            }, '单据管理');
          }(),
          h(
            'a' + classNames('item',
              (currentMod == 'store.checkbook' && 'active')), {
                href: '/store-checkbook',
                onclick() {
                  $$expanded.off();
                }
              }, '账目'
          ),
        ])
      ]),
      R.always('')
    )(mods);
  };
  return $$.connect([$$currentMod, $$mods, $$expanded], vf);
}();

const $$voucher = $$.connect(
  [$$currentMod, $$mods],
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('viewVoucherList'),
      () => h(
        'a' + classNames('item', (currentMod === 'voucher') && 'active'), {
          href: '/voucher-list',
        }, '凭证模块'
      ),
      R.always('')
    )(mods);
  }
);

const $$department = $$.connect(
  [$$currentMod, $$mods],
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('editDepartment'),
      () => h(
        'a' + classNames('item', (currentMod === 'department') && 'active'), {
          href: '/department-list',
        }, '车间信息'
      ),
      R.always('')
    )(mods);
  }
);

const $$tenant = $$.connect(
  [$$currentMod, $$mods],
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('viewTenantList'),
      () => h('a' + classNames('item', (currentMod === 'tenant') && 'active'), {
        href: '/tenant-list',
      }, '承包人信息'),
      R.always('')
    )(mods);
  }
);

const $$settings = $$.connect(
  [$$currentMod, $$mods],
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('editSettings'),
      () => h(
        'a' + classNames('item', (currentMod === 'settings') && 'active'), {
          href: '/settings',
        }, '系统设置'
      ),
      R.always('')
    )(mods);
  }
);

const $$meter = function () {
  let $$expanded = $$(false, 'expanded');
  let vf = function ([currentMod, mods, expanded]) {
    let classes = classNames(
      'item', expanded && 'expanded',
      (currentMod == 'meter.meter' || currentMod == 'meter.meter_type') &&
      'active');
    return h(classes, {
      onmouseover() {
        $$expanded.on();
      },
      onmouseout() {
        $$expanded.off();
      }
    }, R.ifElse(
      mods => mods.editMeter || mods.editMeterType,
      mods => [
        '设备管理',
        h('i.fa.fa-caret-down'),
        h('._.sub.menu', [
          R.ifElse(
            R.prop('editMeter'),
            () => h(
              'a' + classNames(
                'item', (currentMod === 'meter.meter') && 'active'
              ), {
                href: '/meter-list',
                onclick() {
                  $$expanded.off();
                }
              }, '表设备信息'
            ),
            R.always('')
          )(mods),
          R.ifElse(
            R.prop('editMeterType'),
            function () {
              return h(
                'a' + classNames(
                  'item', (currentMod === 'meter.meter_type') && 'active'
                ), {
                  href: '/meter-type-list',
                  onclick() {
                    $$expanded.off();
                  }
                }, '表设备类型'
              );
            },
            R.always('')
          )(mods),
          R.ifElse(
            R.prop('editMeterReading'),
            () => h(
              'a' + classNames(
                'item', (currentMod === 'meter.meter_reading') && 'active'
              ), {
                href: '/meter-readings',
                onclick() {
                  $$expanded.off();
                }
              }, '读数设置'
            ),
            R.always('')
          )(mods),
        ])
      ],
      R.always('')
    )(mods));
  };
  return $$.connect([$$currentMod, $$mods, $$expanded], vf);
}();


const $$accountTerm = $$.connect(
  [$$currentMod, $$mods],
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('editAccountTerm'),
      () => h(
        'a' + classNames('item', (currentMod === 'account_term') && 'active'), {
          href: '/account-term',
        }, '帐期管理'
      ),
      R.always('')
    )(mods);
  }
);

const $$invoiceType = $$.connect(
  [$$currentMod, $$mods],
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('editInvoiceType'),
      () => h(
        'a' + classNames('item', (currentMod === 'invoice_type') && 'active'), {
          href: '/invoice-type-list',
        }, '发票类型'
      ),
      R.always('')
    )(mods);
  }
);

const $$voucherSubject = $$.connect(
  [$$currentMod, $$mods],
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('editVoucherSubject'),
      () => h(
        'a' + classNames(
          'item', (currentMod === 'voucher_subject') && 'active'
        ), {
          href: '/voucher-subject-list',
        }, '凭证科目'
      ),
      R.always('')
    )(mods);
  }
);

const $$user = $$.connect(
  [$$currentMod, $$mods],
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('editUser'),
      R.always(h(
        'a' + classNames('item', (currentMod === 'user') && 'active'), {
          href: '/user-list',
        }, '账户管理'
      )),
      R.always('')
    )(mods);
  }
);

const $$chargeBill = $$.connect(
  [$$currentMod, $$mods],
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('editChargeBill'),
      R.always(h(
        'a' + classNames('item', (currentMod === 'charge_bill') && 'active'), {
          href: '/charge-bill/latest',
        }, '费用单录入'
      )),
      R.always('')
    )(mods);
  }
);

const $$storeSubject = $$.connect(
  [$$currentMod, $$mods],
  function ([currentMod, mods]) {
    return R.ifElse(
      R.prop('editStoreSubject'),
      () => h(
        'a' + classNames(
          'item', (currentMod === 'store_subject') && 'active'
        ), {
          href: '/store-subject-list',
        }, '仓储科目'
      ),
      () => ''
    )(mods);
  }
);

const $$partner = (function () {
  let $$expanded = $$(false, 'expanded');
  let vf = function vf([currentMod, mods, expanded, entityTypes]) {
    return mods.editPartner ?
      h(
        classNames(
          'item',
          (currentMod == 'partner.' + entityTypes.CUSTOMER ||
          currentMod == 'partner.' + entityTypes.SUPPLIER) &&
          'active',
          expanded && 'expanded'
        ), {
          onmouseover() {
            $$expanded.on();
          },
          onmouseout() {
            $$expanded.off();
          }
        }, [
          '往来户管理',
          h('i.fa.fa-caret-down'),
          h('._.sub.menu', [
            h(
              'a' + classNames(
                'item', currentMod === 'partner.' + entityTypes.CUSTOMER &&
                'active'
              ), {
                href: '/partner-list?type=' + entityTypes.CUSTOMER,
                onclick() {
                  $$expanded.off();
                }
              },
              '客户管理'
            ),
            h(
              'a' + classNames(
                'item', currentMod === 'partner.' + entityTypes.SUPPLIER &&
                'active'
              ), {
                href: '/partner-list?type=' + entityTypes.SUPPLIER,
                onclick() {
                  $$expanded.off();
                }
              },
              '供应商管理'
            ),
          ])
        ]
      ) : void 0;
  };
  return $$.connect([$$currentMod, $$mods, $$expanded, $$entityTypes], vf);
}());

const $$paymentRecord = $$.connect(
  [$$currentMod, $$mods, $$PAYMENT_RECORD_STATES],
  function ([currentMod, mods, PAYMENT_RECORD_STATES]) {
    let classes = classNames('item',
      (currentMod == 'payment_record') && 'active');
    return R.ifElse(
      R.prop('editPaymentRecord'),
      R.always(h('a' + classes, {
        href: '/payment-record-list?status=' + PAYMENT_RECORD_STATES.UNPROCESSED
      }, '扣费管理')),
      R.always('')
    )(mods);
  }
);

const $$checmicalSupplier = $$.connect(
  [$$currentMod, $$mods],
  function ([currentMod, mods]) {
    let classes = classNames('item',
                             (currentMod == 'chemical_supplier') && 'active');
    return R.ifElse(
      R.prop('editChemicalSupplier'),
      R.always(h('a' + classes, {
        href: '/chemical-supplier-list'
      }, '化学品供应商管理')),
      R.always('')
    )(mods);
  }
);

const vf = function vf([
  home, invoice, store, voucher, department, tenant, settings, meter,
  accountTerm, invoiceType, voucherSubject, user, chargeBill, storeSubject,
  partner, paymentRecord, chemicalSupplier
]) {
  return h('._.menu.top', [
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
    chargeBill,
    storeSubject,
    partner,
    paymentRecord,
    chemicalSupplier,
    R.ifElse(
      R.prop('user'),
      () => h('.right.color-gray', [
        '欢迎',
        h('a.item.c1.username', {
          href: '/profile',
        }, authStore.user.username),
        h('a.px1', {
          title: '退出',
          href: '#',
          onclick() {
            authStore.logout().then(function () {
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
    )(authStore)
  ].filter(R.identity));
};

export const $$navBar = $$.connect(
  [
    $$home, $$invoice, $$store, $$voucher, $$department, $$tenant,
    $$settings, $$meter, $$accountTerm, $$invoiceType, $$voucherSubject, $$user,
    $$chargeBill, $$storeSubject, $$partner, $$paymentRecord,
    $$checmicalSupplier
  ],
  vf,
  'nav-bar'
);

export const navBar = {
  $$view: $$navBar,
};

export const setupNavBar = function (mod) {
  if (R.isEmpty($$mods.val())) {
    return principal
      .could('view.invoice.list')
      .could('view.voucher.list')
      .could('edit.department')
      .could('view.tenant.list')
      .could('edit.settings')
      .could('edit.meter')
      .could('edit.meter_type')
      .could('edit.account_term')
      .could('edit.invoice_type')
      .could('edit.voucher_subject')
      .could('edit.user')
      .could('manage.store')
      .could('edit.charge_bill')
      .could('edit.store_subject')
      .could('edit.partner')
      .could('edit.meter_reading')
      .could('edit.payment_record')
      .could('edit.chemical_supplier')
      .then(function (viewInvoiceList, viewVoucherList, editDepartment,
                      viewTenantList, editSettings, editMeter, editMeterType,
                      editAccountTerm, editInvoiceType, editVoucherSubject,
                      editUser, manageStore, editChargeBill, editStoreSubject,
                      editPartner, editMeterReading, editPaymentRecord,
                      editChemicalSupplier) {
        constStore.get()
          .then(function ({
            INVOICE_STATES,
            ENTITY_TYPES,
            PAYMENT_RECORD_STATES
          }) {
            $$.update([
              [$$mods, {
                viewInvoiceList,
                viewVoucherList,
                editDepartment,
                viewTenantList,
                editSettings,
                editMeter,
                editMeterType,
                editAccountTerm,
                editInvoiceType,
                editVoucherSubject,
                editUser,
                manageStore,
                editChargeBill,
                editStoreSubject,
                editPartner,
                editMeterReading,
                editPaymentRecord,
                editChemicalSupplier,
              }],
              [$$currentMod, mod],
              [$$invoiceStates, INVOICE_STATES],
              [$$entityTypes, ENTITY_TYPES],
              [$$PAYMENT_RECORD_STATES, PAYMENT_RECORD_STATES]
            ]);
          });
      });
  }
  $$currentMod.val(mod);
  return Promise.resolve();
};
