import $$ from './xx';
import virtualDom from 'virtual-dom';
import page from 'page';
var h = virtualDom.h;
import classNames from './class-names';
import accountStore from './store/account-store';
import principal from './principal';
import R from 'ramda';

var _classNames = function (activated) {
  return classNames('item', activated && 'active');
};

export var $$mods = $$({}, 'mods');

export var $$currentMod = $$('home', 'current-module');

var valueFunc = function valueFunc(currentMod, mods) {
  if (!accountStore.user) {
    return h('');
  }
  return h('.menu.top', [
    h('a' + _classNames(currentMod === 'home'), {
      href: '/',
      onclick() {
        page.route('/');
        return false;
      }
    }, [
      h('i.fa.fa-home'),
    ]),
    mods.viewInvoiceList? h('a' + _classNames(currentMod === 'invoice'), {
      href: '/invoice',
      onclick() {
        page('/invoice-list');
        return false;
      }
    }, '发票模块'): '',
    mods.viewVoucherList? h('a' + _classNames(currentMod === 'voucher'), {
      href: '/voucher',
      onclick() {
        page('/voucher');
        return false;
      }
    }, '凭证模块'): '',
    h('.right.color-gray', [
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
  ]);
};

export var $$navBar = $$.connect([$$currentMod, $$mods], valueFunc, 'nav-bar');

export var navBar = {
  $$view: $$navBar,
};

export var setupNavBar = function (mod) {
  if (R.isEmpty($$mods.val())) {
    return principal
    .could('view.invoice.list')
    .could('view.voucher.list')
    .then(function (viewInvoiceList, viewVoucherList) {
      $$.update(
        [$$mods, {
          viewInvoiceList,
          viewVoucherList,
        }],
        [$$currentMod, mod]
      );
    });
  }
  $$currentMod.val(mod);
  return Promise.resolve();
};
