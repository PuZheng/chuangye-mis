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
      h('th', '可抵税余额'),
    ])),
    h('tbody', tenants.map(function (t) {
      let income = R.path(['account', 'income'])(t);
      let expense = R.path(['account', 'expense'])(t);
      let accountUnitialized = income == void 0 || expense == void 0;
      return h('tr' + (accountUnitialized? '.no-account': ''), [
        h('td', h('a', {
          href: '/tenant/' + t.id,
        }, t.entity.name)),
        h('td', R.ifElse(
          R.identity,
          function ({ name }) { return name; },
          R.always('--')
        )(t.deparment)),
        h('td', t.contact),
        h('td', R.ifElse(
          R.identity,
          function ({ income }) { return '' + income; },
          R.always('0')
        )(t.account)),
        h('td', R.ifElse(
          R.identity,
          function ({ expense }) { return '' + expense; },
          R.always('0')
        )(t.account)),
        h('td', R.ifElse(
          R.identity,
          function ({ taxOffsetBalance }) { return '' + taxOffsetBalance; },
          R.always('0')
        )(t.account))
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
  [nameFilter, table, loading, tableHints, paginator]
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
    table,
    tableHints,
    h('.paginator-container', paginator),
  ]);
};

export default {
  page: {
    get $$view() {
      return $$.connect(
        [$$nameFilter, $$table, $$loading, $$tableHints({
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
