import $$ from 'slot';
import virtualDom from 'virtual-dom';
import $$searchBox from '../widget/search-box';
import $$queryObj from '../query-obj';
import $$paginator from '../widget/paginator';
import $$tableHints from '../widget/table-hints';
import tenantStore from '../store/tenant-store';
import config from '../config';
import page from 'page';
import R from 'ramda';

var h = virtualDom.h;

var $$loading = $$(false, 'loading');
var $$tenants = $$([], 'tenants');
var $$totalCnt = $$(0, 'totalCnt');

var tableVf = function ([tenants]) {
  return h('table.table.compact.striped', [
    h('thead', h('tr', [
      h('th', '姓名'),
      h('th', '车间'),
      h('th', '联系方式'),
      h('th', '累计收入'),
      h('th', '累计开销'),
      h('th', '账户结存')
    ])),
    h('tbody', tenants.map(function (t) {
      let income = R.path(['account', 'income'])(t);
      let expense = R.path(['account', 'expense'])(t);
      let accountUnitialized = income == void 0 || expense == void 0;
      return h('tr' + (accountUnitialized? '.no-account': ''), [
        h('td', h('a', {
          href: '/tenant/' + t.id,
        }, t.entity.name)),
        h('td', t.department.name),
        h('td', t.contact),
        h('td', income === void 0? '--': '' + income),
        h('td', expense === void 0? '--': '' + expense),
        h('td', income && expense? income - expense + '': '--'),
      ]);
    })),
  ]);
};

var $$table = $$.connect([$$tenants], tableVf);

var $$nameFilter = $$searchBox({
  defaultText: '输入承包人姓名',
  $$searchText: $$queryObj.trans(qo => qo.kw || ''),
  onsearch(kw) {
    $$queryObj.patch({
      kw,
      page: 1
    });
  },
  getHints(text) {
    return tenantStore.getHints(text);
  },

});

var vf = function (
  [nameFilter, filters, table, loading, tableHints, paginator]
) {
  return h('#tenant-list-app.list-app' + (loading? '.loading': ''), [
    h('.header', [
      h('.title', '承包人列表'),
      h('button.new-btn', {
        title: '新建承包人',
        onclick() {
          page('/tenant');
        }
      }, h('i.fa.fa-plus')),
      h('.search', nameFilter),
    ]),
    filters,
    table,
    tableHints,
    h('.paginator-container', paginator),
  ]);
};

var $$onlyAccountUninitialized = $$.connect([$$queryObj], function ([qo]) {
  return h('.checkbox', [
    h('input', {
      type: 'checkbox',
      checked: qo.only_account_uninitialized == '1',
      onchange() {
        $$queryObj.patch(
          { only_account_uninitialized: this.checked? '1': '0' }
        );
      }
    }),
    h('label', {
      onclick() {
        $$queryObj.patch({
          only_account_uninitialized:
            qo.only_account_uninitialized == '1'? '0': '1'
        });
      }
    }, '仅看账户未初始化'),
  ]);
});

var $$filters = $$.connect(
  [$$onlyAccountUninitialized], function ([onlyAccountUninitialized]) {
    return h('.filters', [onlyAccountUninitialized]);
  }
);

export default {
  page: {
    get $$view() {
      return $$.connect(
        [$$nameFilter, $$filters, $$table, $$loading, $$tableHints({
          $$totalCnt,
          $$queryObj,
          pageSize: config.getPageSize('tenant'),
        }), $$paginator({
          $$totalCnt,
          $$queryObj,
          pageSize: config.getPageSize('voucher'),
        })], vf
      );
    }
  },
  init() {
    $$loading.toggle();
    tenantStore
    .fetchList($$queryObj.val())
    .then(function ({data: tenants, totalCnt}) {
      $$.update([
        [$$tenants, tenants],
        [$$totalCnt, totalCnt],
        [$$loading, false]
      ]);
    });
  }
};
