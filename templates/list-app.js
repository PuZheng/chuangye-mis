import $$ from 'slot';
import { h } from 'virtual-dom';
import classNames from '../class-names';
import $$tableHints from 'widget/table-hints';
import $$paginator from 'widget/paginator';
import <%= store模块引入名 %> from 'store/<%= store模块文件 %>';
import $$queryObj from '../query-obj';
import $$searchBox from 'widget/search-box';
import R from 'ramda';

const $$loading = $$(false, 'loading');
const $$list = $$([], 'list');
const $$totalCnt = $$(0, 'total-cnt');

const vf = function ([loading, searchBox, filters, table, tableHints,
                   paginator]) {
  return h(classNames('list-app', 'loading'), [
    h('.header', [
      h('.title', '<%= 对象label %>列表'),
      h('a.new-btn', {
        href: '/<%= 对象名称.replace('_', '-') %>'
      }, h('i.fa.fa-plus', {
        title: '创建<%= 对象label %>'
      })),
      h('.search', searchBox)
    ]),
    filters,
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
    return <%= store模块引入名 %>.getHints(kw);
  }
});

const $$filters = $$.connect([], function (filters) {
  return h('.filters', filters);
});

const $$table = $$.connect([$$list], function ([list]) {
  return h('table.compact.striped', [
    // TODO fill lists
    h('thead', h('tr', [

    ])),
    h('tbody', list.map(function (it) {
      return h('tr', [

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
      return $$.connect([$$loading, $$mySearchBox, $$filters, $$table,
                        $$myTableHints, $$myPaginator], vf);
    }
  },
  init({ query }) {
    $$loading.on();
    <%= store模块引入名 %>.fetchList(query)
    .then(function ({ totalCnt, data }) {
      $$.update([
        [$$loading, false],
        [$$totalCnt, totalCnt],
        [$$list, data]
      ]);
    });
  }
};
