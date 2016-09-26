import $$ from 'slot';
import $$tabs from 'widget/tabs';
import R from 'ramda';
import $$queryObj from '../../query-obj';
import virtualDom from 'virtual-dom';
import $$dropdown from 'widget/dropdown';
import $$searchDropdown from 'widget/search-dropdown';
import constStore from 'store/const-store';
import storeSubjectStore from '../../store/store-subject-store';
import storeOrderStore from '../../store/store-order-store';
import $$tableHints from 'widget/table-hints';
import $$paginator from 'widget/paginator';
import config from '../../config';
import $$myOth from 'widget/my-oth';
import moment from 'moment';
import tenantStore from '../../store/tenant-store';

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
  onchange(date_span) {
    $$queryObj.patch({ date_span });
  },
  $$value: $$queryObj.trans(R.prop('date_span')),
  $$options: $$([
    {
      text: '不限日期范围',
      value: '',
    }, { 
      text: '一周内',
      value: 'in_7_days',
    }, {
      text: '一月内',
      value: 'in_30_days',
    }
  ]),
});

var $$subjectDropdown = $$searchDropdown({
  defaultText: '选择单据科目',
  onchange(subject_id) {
    $$queryObj.patch({ subject_id });
  },
  $$value: $$queryObj.trans(R.prop('subject_id')),
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

var $$tenantDropdown = $$searchDropdown({
  defaultText: '选择相关承包人',
  onchange(tenant_id) {
    $$queryObj.patch({ tenant_id });
  },
  $$value: $$queryObj.trans(R.prop('tenant_id')),
  $$options: tenantStore.trans(function (list) {
    return R.concat([{
      text: '不限承包人',
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

var filtersVf = function ([dateSpanDropdown, subjectDropdown, tenantDropdown]) {
  return h('.filters', [
    dateSpanDropdown,
    subjectDropdown,
    tenantDropdown,
  ]);
};

var $$totalPriceOth = $$myOth({
  label: '总价',
  column: 'total_price',
});

var $$createdOth = $$myOth({
  label: '创建于',
  column: 'created'
});

var $$filters = $$.connect([$$dateSpanDropdown, $$subjectDropdown, 
                           $$tenantDropdown], filtersVf);

var $$table = $$.connect(
  [$$totalPriceOth, $$createdOth, $$list], 
  function ([totalPriceOth, createdOth, list]) {
  return h('table.table.compact.striped', [
    h('thead', [
      h('tr', [
        h('th', '编号'),
        h('th', '科目'),
        h('th', '数量'),
        h('th', '单价'),
        totalPriceOth,
        h('th', '发票'),
        createdOth,
      ])
    ]),
    h('tbody', list.map(function (record) {
      return h('tr', [
        h('td', '' + record.id),
        h('td', record.storeSubject.name),
        h('td', `${record.quantity}(${record.storeSubject.unit})`),
        h('td', '' + record.unitPrice),
        h('td', record.unitPrice * record.quantity + ''),
        h('td', R.ifElse(
          R.identity,
          R.prop('number'),
          R.always('--')
        )(record.invoice)),
        h('td', moment(record.created).format('YYYY-MM-DD HH:mm')),
      ]);
    }))
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
  init(ctx) {
    $$loading.val(true);
    Promise.all([
      constStore.get(),
      storeSubjectStore.list,
      storeOrderStore.fetchList(ctx.query),
    ])
    .then(function ([{ storeOrderDirections, storeOrderTypes }, storeSubjects, { totalCnt, data }]) {
      $$.update(
        [$$loading, false],
        [$$storeOrderTypes, storeOrderTypes],
        [$$storeOrderDirections, storeOrderDirections],
        [$$storeSubjects, storeSubjects],
        [$$list, data],
        [$$totalCnt, totalCnt]
      );
    });
  }
};
