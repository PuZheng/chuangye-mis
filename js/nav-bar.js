import $$ from 'slot';
import virtualDom from 'virtual-dom';
import page from 'page';
const h = virtualDom.h;
import classNames from './class-names';
import authStore from './store/auth-store';
import principal from './principal';
import R from 'ramda';
import constStore from 'store/const-store';
import co from 'co';

const EMPTY_NODE = h('');
const $$perms = $$(new Set(), 'perms');
const $$currentMod = $$('home', 'current-module');
const makeItem = function ({mod, target, label, perm}) {
  return $$.connect([$$currentMod, $$perms], function ([currentMod, perms]) {
    if (!perm || perms.has(perm)) {
      return h('a' + classNames('item', currentMod == mod && 'active'), {
        href: target,
      }, label);
    }
  });
};

const makeSubMenu = function ({ mods, label, }) {
  let $$expanded = $$(false, 'expanded');
  let vf = function ([currentMod, expanded, perms]) {
    mods = mods.filter(function (mod) {
      return !mod.perm || perms.has(mod.perm);
    });
    if (!mods.length) {
      return;
    }
    if (mods.length == 1) {
      let mod = mods[0];
      return h('a' + classNames('item', currentMod == mod && 'active'), {
        href: mod.target,
      }, mod.label);
    }
    let classes = classNames(
      'item',
      ~mods.map(R.prop('name')).indexOf(currentMod) && 'active',
      expanded && 'expanded'
    );
    return h(classes, {
      onmouseover() {
        $$expanded.on();
      },
      onmouseout() {
        $$expanded.off();
      }
    }, [
      label,
      h('i.fa.fa-caret-down'),
      h('._.sub.menu', mods.map(function (mod) {
        let classes = classNames('item', currentMod == mod.name && 'active');
        return h('a' + classes, {
          href: mod.target,
          onclick() {
            $$expanded.off();
          },
        }, mod.label);
      }))
    ]);
  };
  return $$.connect([$$currentMod, $$expanded, $$perms], vf);
};

const vf = function vf(mods) {
  return h('._.menu.top', [
    ...mods,
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
              $$navBar.connect([]).val(EMPTY_NODE);
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


let $$navBar = $$(EMPTY_NODE, 'nav-bar');

export const navBar = {
  $$view: $$navBar,
};

export const setupNavBar = function (mod) {
  if ($$navBar.val() == EMPTY_NODE) {
    return co(function *() {
      $$perms.val(yield principal.load());
      let { ENTITY_TYPES, INVOICE_STATES, PAYMENT_RECORD_STATES } =
        yield constStore.get();
      let $$home = makeItem({
        mod: 'home', target: '/',  label: h('i.fa.fa-home')
      });
      let $$invoice = makeSubMenu({
        label: '发票模块',
        mods: [
          {
            name: 'invoice',
            label: '发票列表',
            perm: 'view.invoice.list',
            target: '/invoice-list?status=' + INVOICE_STATES.UNAUTHENTICATED,
          }, {
            name: 'invoice_type',
            label: '发票类型列表',
            perm: 'edit.invoice_type',
            target: '/invoice-type-list',
          }
        ]
      });
      let $$store = makeSubMenu({
        label: '仓储管理',
        mods: [
          {
            name: 'store.order', label: '单据管理',
            target: '/store-order-list', perm: 'manage.store'
          }, {
            name: 'store.checkbook', label: '帐目',
            target: '/store-checkbook', perm: 'manage.store'
          }, {
            name: 'store_subject', label: '仓储科目列表',
            target: '/store-subject-list', perm: 'edit.store_subject',
          }
        ]
      });
      let $$voucher = makeSubMenu({
        label: '凭证模块',
        mods: [
          {
            name: 'voucher', target: '/voucher-list', label: '凭证列表',
            perm: 'view.voucher.list',
          }, {
            name: 'voucher_subject', target: '/voucher-subject-list',
            label: '凭证科目列表', perm: 'edit.voucher_subject'
          }
        ]
      });
      let $$estate = makeSubMenu({
        label: '物业管理',
        mods: [
          {
            name: 'department', label: '车间管理', target: '/department-list',
            perm: 'edit.department'
          }, {
            name: 'plant', label: '厂房管理', target: '/plant-list',
            perm: 'edit.plant'
          }
        ]
      });
      let $$tenant = makeItem({
        label: '承包人管理',
        mod: 'tenant',
        target: '/tenant-list',
        perm: 'view.tenant.list'
      });
      let $$settings = makeItem({
        label: '配置管理',
        mod: 'settings',
        target: '/settings',
        perm: 'edit.settings'
      });
      let $$meter = makeSubMenu({
        label: '设备管理',
        mods: [
          {
            label: '表设备信息',
            name: 'meter.meter',
            target: '/meter-list',
            perm: 'edit.meter'
          }, {
            label: '表设备类型',
            name: 'meter.meter_type',
            target: '/meter-type-list',
            perm: 'edit.meter_type'
          }
        ]
      });
      let $$accountTerm = makeItem({
        label: '帐期管理',
        target: '/account-term',
        mod: 'account_term',
        perm: 'edit.account_term'
      });
      let $$user = makeItem({
        label: '账户管理',
        mod: 'user',
        target: '/user-list',
        perm: 'edit.user',
      });
      let $$chargeBill = makeItem({
        label: '费用单录入',
        target: '/charge-bill/latest',
        mod: 'charge_bill',
        perm: 'edit.charge_bill'
      });
      let $$partner = makeSubMenu({
        label: '往来户管理',
        mods: [
          {
            label: '客户管理',
            name: 'partner.' + ENTITY_TYPES.CUSTOMER,
            target: '/partner-list?type=' + ENTITY_TYPES.CUSTOMER,
            perm: 'edit.customer',
          }, {
            label: '供应商管理',
            name: 'partner.' + ENTITY_TYPES.SUPPLIER,
            target: '/partner-list?type=' + ENTITY_TYPES.SUPPLIER,
            perm: 'edit.supplier',
          }, {
            label: '化学品供应商管理',
            name: 'chemical_supplier',
            target: '/chemical-supplier-list',
            perm: 'edit.chemical_supplier',
          }
        ]
      });
      let $$paymentRecord = makeItem({
        label: '扣费管理',
        mod: 'payment_record',
        target: '/payment-record-list?status=' +
          PAYMENT_RECORD_STATES.UNPROCESSED,
        perm: 'edit.payment_record',
      });
      $$navBar.connect([
        $$home, $$invoice, $$store, $$voucher, $$estate, $$tenant, $$settings,
        $$meter, $$accountTerm, $$user, $$chargeBill, $$partner, $$paymentRecord
      ], vf).refresh(null, true);
    });
  }
  $$currentMod.val(mod);
  return Promise.resolve();
};
