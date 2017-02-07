import $$ from 'slot';
import { h } from 'virtual-dom';
import $$tableHints from 'widget/table-hints';
import $$paginator from 'widget/paginator';
import plantStore from 'store/plant-store';
import $$queryObj from '../query-obj';
import $$searchBox from 'widget/search-box';
import R from 'ramda';

const $$loading = $$(false, 'loading');
const $$list = $$([], 'list');
const $$totalCnt = $$(0, 'total-cnt');

const vf = function ([loading, searchBox, table, tableHints,
                   paginator]) {
  return h('.list-app' + (loading? '.loading': ''), [
    h('.header', [
      h('.title', '厂房列表'),
      h('a.new-btn', {
        href: '/plant'
      }, h('i.fa.fa-plus', {
        title: '创建厂房'
      })),
      h('.search', searchBox)
    ]),
    table,
    tableHints,
    h('.paginator-container', paginator),
  ]);
};

const $$mySearchBox = $$searchBox({
  defaultText: '输入名称或者缩写',
  $$searchText: $$queryObj.trans(R.propOr('', 'kw')),
  onsearch(kw) {
    $$queryObj.patch({ kw, page: 1 });
  },
  getHints(kw) {
    return plantStore.getHints(kw);
  }
});

const $$table = $$.connect([$$list], function ([list]) {
  return h('table.compact.striped', [
    h('thead', h('tr', [
      h('th', '名称'),
      h('th', '面积'),
      h('th', '车间数量'),
    ])),
    h('tbody', list.map(function ({ id, name, area, departmentCnt }) {
      return h('tr', [
        h('td', h('a', {
          href: '/plant/' + id
        }, name)),
        h('td', '' + area),
        h('td', '' + departmentCnt),
      ]);
    })),
  ]);
});

export default {
  page: {
    get $$view() {
      let $$page = $$queryObj.map(R.prop('page'));
      let $$pageSize = $$queryObj.map(R.prop('page_size'));
      let $$myTableHints = $$tableHints({ $$totalCnt, $$page, $$pageSize });
      let $$myPaginator = $$paginator({
        $$totalCnt, $$page, $$pageSize, onNavigate(page) {
          $$queryObj.patch({ page });
        }
      });
      return $$.connect([$$loading, $$mySearchBox, $$table,
                        $$myTableHints, $$myPaginator], vf);
    }
  },
  init({ query }) {
    $$loading.on();
    plantStore.fetchList(query)
    .then(function ({ totalCnt, data }) {
      $$.update([
        [$$loading, false],
        [$$totalCnt, totalCnt],
        [$$list, data]
      ]);
    });
  }
};
