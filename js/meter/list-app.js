import $$ from 'slot';
import virtualDom from 'virtual-dom';
import $$searchBox from '../widget/search-box';
import $$queryObj from '../query-obj';
import page from 'page';
import meterStore from '../store/meter-store';
import $$paginator from '../widget/paginator';
import $$tableHints from '../widget/table-hints';
import config from '../config';

var $$list = $$([], 'list');
var $$loading = $$(false, 'loading');
var $$totalCnt = $$(0, 'total-cnt');

var $$nameFilter = $$searchBox({
  defaultText: '输入表名称',
  $$searchText: $$queryObj.trans(qo => qo.kw || ''),
  onsearch(text) {
    $$queryObj.patch({
      kw: text
    });
  },
  getHints(text) {
    return meterStore.getHints(text);
  },
});

var h = virtualDom.h;

let vf = function ([nameFilter, list, loading, tableHints, paginator]) {
  return h('.list-app' + (loading? '.loading': ''), [
    h('.header', [
      h('.title', '表设备列表'),
      h('button.new-btn', {
        title: '新建电表',
        onclick() {
          page('/meter');
        }
      }, [
        h('i.fa.fa-plus'),
      ]),
      h('.search', nameFilter),
    ]),
    h('table.table.compact.striped', [
      h('thead', [
        h('tr', [
          h('th', '名称'),
          h('th', '类型'),
          h('th', '车间'),
          h('th', '线路'),
          h('th', '倍数'),
          h('th', '状态'),
        ])
      ]),
      h('tbody', list.map(function (a) {
        return h('tr', [
          h('td', h('a', {
            href: '/meter/' + a.id,
          }, a.name)),
          h('td', a.type),
          h('td', (a.department || {}).name || '--'),
          h('td', (a.parentElectricMeter || {}).name || '--'),
          h('td', '' + a.times),
          h('td', a.status),
        ]);
      })),
    ]),
    tableHints,
    h('.paginator-container', paginator),
  ]); 
};

export default {
  page: {
    $$view: $$.connect([
      $$nameFilter, $$list, $$loading,
      $$tableHints({
        $$totalCnt,
        $$queryObj,
        pageSize: config.getPageSize('meter'),
      }),
      $$paginator({
        $$totalCnt,
        $$queryObj,
        pageSize: config.getPageSize('meter'),
      })
    ], vf, 'list-app'), 
  },
  $$list,
  $$loading,
  $$totalCnt,
};
