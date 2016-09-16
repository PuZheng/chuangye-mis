import $$ from 'slot';
import virtualDom from 'virtual-dom';
import $$searchBox from '../widget/search-box';
import $$queryObj from '../query-obj';
import $$paginator from '../widget/paginator';
import $$tableHints from '../widget/table-hints';
import tenantStore from '../store/tenant-store';
import config from '../config';
import page from 'page';

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
    ])),
    h('tbody', tenants.map(function (t) {
      return h('tr', [
        h('td', h('a', {
          href: '/tenant/' + t.id,
          onclick() {
            page('/tenant/' + t.id);
          }
        }, t.entity.name)),
        h('td', t.department.name),
        h('td', t.contact),
      ]);
    })),
  ]);
};

var $$table = $$.connect([$$tenants], tableVf);

var $$nameFilter = $$searchBox({
  defaultText: '输入承包人姓名/车间',
  $$searchText: $$queryObj.trans(qo => qo.kw || ''),
  onsearch(text) {
    $$queryObj.patch({
      kw: text
    });
  },
  getHints(text) {
    return tenantStore.getHints(text);
  },

});

var vf = function ([nameFilter, table, loading, tableHints, paginator]) {
  return h('.list-app' + (loading? '.loading': ''), [
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
    $$view: $$.connect([$$nameFilter, $$table, $$loading, $$tableHints({
      $$totalCnt,
      $$queryObj,
      pageSize: config.getPageSize('tenant'),
    }), $$paginator({
      $$totalCnt,
      $$queryObj,
      pageSize: config.getPageSize('voucher'),
    })], vf)
  },
  init() {
    $$loading.toggle();
    tenantStore
    .fetchList($$queryObj.val())
    .then(function ({data: tenants, totalCnt}) {
      $$.update(
        [$$tenants, tenants],
        [$$totalCnt, totalCnt],
        [$$loading, false]
      );
    });
  }
};
