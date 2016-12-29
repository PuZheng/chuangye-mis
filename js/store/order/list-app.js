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
import page from 'page';

var h = virtualDom.h;
var $$storeSubjects = $$([], 'store-subjects');

var $$storeSubjectTypes = $$({}, 'store-order-types');
var $$storeOrderDirections = $$({}, 'store-order-directions');
var $$list = $$([], 'list');
var $$totalCnt = $$(0, 'total-cnt');
var $$loading = $$(false, 'loading');
var $$tenants = $$([], 'tenants');


var contentVf = function (
  [qo, loading, filters, table, tableHints, paginator]
) {
  return h('.list-app' + (loading? '.loading': ''), [
    h('.header', [
      h('.title', '单据列表'),
      h('button.new-btn', {
        onclick() {
          page(`/store-order?direction=${qo.direction}&type=${qo.type}`);
        }
      }, [
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
  $$options: $$storeSubjects.trans(R.map(it => ({
    text: it.name,
    value: it.id,
    acronym: it.acronym,
  }))),
});

var $$tenantDropdown = $$searchDropdown({
  defaultText: '选择相关承包人',
  onchange(tenant_id) {
    $$queryObj.patch({ tenant_id });
  },
  $$value: $$queryObj.trans(R.prop('tenant_id')),
  $$options: $$tenants.trans(R.map(({ id, entity: { name, acronym } }) => ({
    value: id,
    text: name,
    acronym,
  }))),
});

var filtersVf = function ([dateSpanDropdown, subjectDropdown, tenantDropdown]) {
  return h('.filters', [
    dateSpanDropdown,
    subjectDropdown,
    tenantDropdown,
  ]);
};

var $$totalPriceOth = $$myOth({
  label: '总价(元)',
  column: 'total_price',
});

var $$createdOth = $$myOth({
  label: '创建于',
  column: 'created'
});

var $$filters = $$.connect(
  [$$dateSpanDropdown, $$subjectDropdown, $$tenantDropdown], filtersVf
);

var tableVf = function ([totalPriceOth, createdOth, list]) {
  return h('table.table.compact.striped', [
    h('thead', [
      h('tr', [
        h('th', '编号'),
        h('th', '科目'),
        h('th', '数量'),
        h('th', '单价(元)'),
        totalPriceOth,
        h('th', '发票'),
        createdOth,
        h('th', '承包人'),
      ])
    ]),
    h('tbody', list.map(function (record) {
      return h('tr', [
        h('td', h('a', {
          href: '/store-order/' + record.id,
        }, '' + record.id)),
        h('td', record.storeSubject.name),
        h('td', `${record.quantity}(${record.storeSubject.unit})`),
        h('td', R.ifElse(
          R.identity,
          R.concat(''),
          R.always('--')
        )(record.unitPrice)),
        h('td', R.ifElse(
          R.identity,
          R.pipe(R.multiply(record.quantity), R.concat('')),
          R.always('--')
        )(record.unitPrice)),
        h('td', R.ifElse(
          R.identity,
          R.prop('number'),
          R.always('--')
        )(record.invoice)),
        h('td', moment(record.created).format('YYYY-MM-DD HH:mm')),
        h('td', record.tenant.entity.name),
      ]);
    }))
  ]);
};

var $$table = $$.connect(
  [$$totalPriceOth, $$createdOth, $$list], tableVf
);

var $$tabNames = $$.connect(
  [$$storeOrderDirections, $$storeSubjectTypes],
  function ([storeOrderDirections, storeSubjectTypes]) {
    return R.flatten(R.values(storeSubjectTypes).map(function (type) {
      return R.values(storeOrderDirections).map(function (direction) {
        return `${type}(${direction})`;
      });
    }));
  },
  'tab-names'
);

export default {
  page: {
    get $$view() {
      return $$tabs({
        $$tabNames: $$tabNames,
        $$activeIdx: $$.connect(
          [$$queryObj, $$tabNames], function ([qo, tabNames]) {
            return tabNames.indexOf(`${qo.type}(${qo.direction})`);
          }
        ),
        onchange(idx, tabName) {
          let re = /(.+)\((.+)\)/;
          let m = tabName.match(re);
          if (m) {
            $$queryObj.patch({ type: m[1], direction: m[2] });
          }
        },
        $$content: $$.connect(
          [$$queryObj, $$loading, $$filters, $$table, $$tableHints({
            $$totalCnt,
            $$queryObj,
            pageSize: config.getPageSize('storeOrder'),
          }), $$paginator({
            $$totalCnt,
            $$queryObj,
            pageSize: config.getPageSize('invoice'),
          })], contentVf
        ),
      });
    }
  },
  init(ctx) {
    $$loading.val(true);
    Promise.all([
      constStore.get(),
      storeSubjectStore.list,
      storeOrderStore.fetchList(ctx.query),
      tenantStore.list,
    ])
    .then(function (
      [{ STORE_ORDER_DIRECTIONS, STORE_SUBJECT_TYPES }, storeSubjects,
        { totalCnt, data }, tenants]
    ) {
      $$.update(
        [$$loading, false],
        [$$storeSubjectTypes, STORE_SUBJECT_TYPES],
        [$$storeOrderDirections, STORE_ORDER_DIRECTIONS],
        [$$storeSubjects, storeSubjects],
        [$$list, data],
        [$$totalCnt, totalCnt],
        [$$tenants, tenants]
      );
    });
  }
};
