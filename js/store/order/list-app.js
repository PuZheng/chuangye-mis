import $$ from 'slot';
import $$tabs from 'widget/tabs';
import R from 'ramda';
import $$queryObj from '../../query-obj';
import virtualDom from 'virtual-dom';
import $$dropdown from 'widget/dropdown';
import $$searchDropdown from 'widget/search-dropdown';
import constStore from 'store/const-store';
import storeSubjectStore from '../../store/store-subject-store';
import $$tableHints from 'widget/table-hints';
import $$paginator from 'widget/paginator';
import config from '../../config';
import $$oth from 'widget/oth';

var h = virtualDom.h;
var $$storeSubjects = $$([], 'store-subjects');

var $$storeOrderTypes = $$({}, 'store-order-types');
var $$storeOrderDirections = $$({}, 'store-order-directions');
var $$list = $$([], 'list');
var $$totalCnt = $$(0, 'total-cnt');
var $$loading = $$(false, 'loading');


var contentVf = function ([loading, filters, table, tableHints, paginator]) {
  return h('.list-app' + (loading? '.loading': ''), [
    h('.header', [
      h('.title', '单据列表'),
      h('button.new-btn', [
        h('i.fa.fa-plus'),
      ]),
    ]),
    filters,
    table,
    tableHints,
    h('.paginator-container', paginator)
  ]);
};

var $$dateSpanDropdown = $$dropdown({
  defaultText: '选择日期范围',
  onchange(dateSpan) {
    $$queryObj.patch({ dateSpan });
  },
  $$value: $$queryObj.trans(R.prop('date_span')),
  $$options: $$([
    {
      text: '不限日期范围',
      value: '',
    },
    '一周内',
    '一月内',
  ]),
});

var $$subjectDropdown = $$searchDropdown({
  defaultText: '选择单据科目',
  onchange(subject) {
    $$queryObj.patch({ subject });
  },
  $$value: $$queryObj.trans(R.prop('subject')),
  $$options: $$storeSubjects.trans(function (list) {
    return R.concat([{
      text: '不限科目',
      value: '',
    }], list.map(function (o) {
      return {
        text: o.name,
        value: o.id,
        acronym: o.acronym,
      };
    }));
  })
});

var filtersVf = function ([dateSpanDropdown, subjectDropdown]) {
  return h('.filters', [
    dateSpanDropdown,
    subjectDropdown,
  ]);
};

var $$createdOth = $$oth({
  label: '创建于',
  $$order: $$queryObj.trans(function (qo) {
    let [ col, order ] = (qo.sort_by || '').split('.');
    return R.ifElse(
      R.equals('created'),
      R.always(order || 'asc'),
      R.always('')
    )(col);
  }),
  onchange(order) {
    $$queryObj.patch({ sort_by: 'created.' + order });
  }
});

var $$filters = $$.connect([$$dateSpanDropdown, $$subjectDropdown], filtersVf);

var $$table = $$.connect([$$createdOth, $$list], function ([createdOth, list]) {
  return h('table.table.compact.striped', [
    h('thead', [
      h('tr', [
        h('th', '编号'),
        h('th', '科目'),
        h('th', '数量'),
        h('th', '单价'),
        h('th', '总价'),
        h('th', '发票'),
        createdOth,
      ])
    ]),
    h('tbody')
  ]);
});

var $$tabNames = $$.connect(
  [$$storeOrderDirections, $$storeOrderTypes], 
  function ([storeOrderDirections, storeOrderTypes]) {
    return R.flatten(R.values(storeOrderTypes).map(function (type) {
      return R.values(storeOrderDirections).map(function (direction) {
        return `${type}(${direction})`;
      });
    })); 
  },
  'tab-names'
);

export default {
  page: {
    $$view: $$tabs({
      $$tabNames: $$tabNames,
      $$activeIdx: $$.connect([$$queryObj, $$tabNames], function ([qo, tabNames]) {
        return tabNames.indexOf(`${qo.type}(${qo.direction})`);
      }),
      onchange(idx, tabName) {
        let re = /(.+)\((.+)\)/;
        let m = tabName.match(re);
        if (m) {
          $$queryObj.patch({ type: m[1], direction: m[2] });
        }
      },
      $$content: $$.connect([$$loading, $$filters, $$table, $$tableHints({
        $$totalCnt,
        $$queryObj,
        pageSize: config.getPageSize('storeOrder'),
      }), $$paginator({
        $$totalCnt,
        $$queryObj,
        pageSize: config.getPageSize('invoice'),
      })], contentVf),
    }),
  },
  init() {
    $$loading.val(true);
    Promise.all([
      constStore.get(),
      storeSubjectStore.list,
    ])
    .then(function ([{ storeOrderDirections, storeOrderTypes }, storeSubjects]) {
      $$.update(
        [$$loading, false],
        [$$storeOrderTypes, storeOrderTypes],
        [$$storeOrderDirections, storeOrderDirections],
        [$$storeSubjects, storeSubjects]
      );
    });
  }
};
