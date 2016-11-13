import $$ from 'slot';
import virtualDom from 'virtual-dom';
import $$searchBox from '../widget/search-box';
import $$queryObj from '../query-obj';
import page from 'page';
import meterStore from '../store/meter-store';
import $$paginator from '../widget/paginator';
import $$tableHints from '../widget/table-hints';
import config from '../config';
import meterTypeStore from '../store/meter-type-store';
import departmentStore from '../store/department-store';
import R from 'ramda';
import { $$dropdown } from '../widget/dropdown';

var $$list = $$([], 'list');
var $$loading = $$(false, 'loading');
var $$totalCnt = $$(0, 'total-cnt');
var $$meterTypes = $$([], 'type-list');
var $$departments = $$([], 'departments');

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

var $$departmentFilter = $$dropdown({
  defaultText: '请选择部门',
  $$value: $$queryObj.trans(R.prop('department')),
  $$options: $$departments.trans(departments => R.concat([{
    text: '不限部门',
  }])(departments.map(it => ({
    value: it.id,
    text: it.name
  })))),
  onchange(department) {
    $$queryObj.patch({ department });
  }
});

let vf = function ([
  nameFilter, typeFilter, departmentFilter, list, loading,
  tableHints, paginator]) {
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
    h('.filters', [typeFilter, departmentFilter]),
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
          h('td', a.meterType.name),
          h('td', (a.department || {}).name || '--'),
          h('td', (a.parentMeter || {}).name || '--'),
          h('td', '' + a.times),
          h('td', a.status),
        ]);
      })),
    ]),
    tableHints,
    h('.paginator-container', paginator),
  ]);
};

var $$typeFilter = $$dropdown({
  defaultText: '请选择设备分类',
  $$value: $$queryObj.trans(qo => qo.type),
  $$options: $$meterTypes.trans(function (meterTypes) {
    console.log(meterTypes);
    return R.concat([{
      text: '不限分类'
    }], meterTypes.map(function (it) {
      return {
        value: it.id,
        text: it.name
      };
    }));
  }),
  onchange(type) {
    $$queryObj.patch({ type });
  }
});

export default {
  page: {
    $$view: $$.connect([
      $$nameFilter, $$typeFilter, $$departmentFilter, $$list, $$loading,
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
  init(ctx) {
    $$loading.toggle();
    let q = ctx.query || {};
    q.page = q.page || 1;
    q.page_size = q.page_size || config.getPageSize('meter');
    Promise.all([
      meterStore.fetchList(q),
      meterTypeStore.list,
      departmentStore.list,
    ])
    .then(function ([{totalCnt, data}, meterTypes, departments]) {
      $$.update(
        [$$loading, false],
        [$$list, data],
        [$$totalCnt, totalCnt],
        [$$meterTypes, meterTypes],
        [$$departments, departments]
      );
    });
  }
};
