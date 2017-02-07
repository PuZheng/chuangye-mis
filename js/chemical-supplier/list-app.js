import $$ from 'slot';
import { h } from 'virtual-dom';
import $$searchBox from 'widget/search-box';
import $$queryObj from '../query-obj';
import R from 'ramda';
import chemicalSupplierStore from 'store/chemical-supplier-store';
import $$tableHints from 'widget/table-hints';
import $$paginator from 'widget/paginator';

const $$loading = $$(false, 'loading');
const $$totalCnt = $$(0, 'total-cnt');
const $$list = $$([], 'list');

const $$table = $$.connect([$$list], function ([list]) {
  return h('table.compact.striped', [
    h('thead', h('tr', [
      h('th', '名称'),
      h('th', '联系方式'),
    ])),
    h('tbody', list.map(function (it) {
      return h('tr', [
        h('td', it.entity.name),
        h('td', it.contact),
      ]);
    }))
  ]);
});

const vf = function ([loading, nameSearchBox, table, tableHints, paginator]) {
  return h('.list-app' + (loading? '.loading': ''), [
    h('.header', [
      h('.title', '化学品供应商列表'),
      h('a.new-btn', {
        href: '/chemical-supplier'
      }, h('i.fa.fa-plus', {
        title: '创建化学品供应商'
      })),
      h('.search', nameSearchBox)
    ]),
    table,
    tableHints,
    h('.paginator-container', paginator),
  ]);
};


const $$nameSearchBox = $$searchBox({
  defaultText: '输入名称或者缩写',
  $$searchText: $$queryObj.trans(R.propOr('', 'kw')),
  onsearch(kw) {
    $$queryObj.patch({ kw, page: 1 });
  },
  getHints(kw) {
    return chemicalSupplierStore.getHints(kw);
  }
});

export default {
  page: {
    get $$view() {
      let $$page = $$queryObj.map(R.prop('page'));
      let $$pageSize = $$queryObj.map(R.prop('page_size'));
      return $$.connect(
        [$$loading, $$nameSearchBox, $$table, $$tableHints({
          $$totalCnt,
          $$page,
          $$pageSize
        }), $$paginator({
          $$totalCnt,
          $$page,
          $$pageSize,
          onNavigate(page) {
            $$queryObj.patch({ page });
          }
        })], vf
      );
    },
  },
  init({ query}) {
    $$loading.on();
    chemicalSupplierStore.fetchList(query)
    .then(function ({ data, totalCnt }) {
      $$.update([
        [$$loading, false],
        [$$list, data],
        [$$totalCnt, totalCnt]
      ]);
    });
  }
};
