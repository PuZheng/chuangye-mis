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
import departmentStore from '../../store/department-store';
import accountTermStore from 'store/account-term-store';
import page from 'page';
import $$searchBox from 'widget/search-box';

var h = virtualDom.h;
var $$storeSubjects = $$([], 'store-subjects');

var $$storeSubjectTypes = $$({}, 'store-order-types');
var $$storeOrderDirections = $$({}, 'store-order-directions');
var $$list = $$([], 'list');
var $$totalCnt = $$(0, 'total-cnt');
var $$loading = $$(false, 'loading');
var $$departments = $$([], 'departments');
var $$accountTerms = $$([], 'account-terms');

var contentVf = function (
  [qo, loading, filters, table, tableHints, paginator, numberSearchBox]
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
      h('.search', numberSearchBox)
    ]),
    filters,
    table,
    tableHints,
    h('.paginator-container', paginator)
  ]);
};

var $$accountTermDropdown = $$dropdown({
  defaultText: '选择账期',
  onchange(account_term_id) {
    $$queryObj.patch({ account_term_id });
  },
  $$value: $$queryObj.trans(R.propOr('', 'account_term_id')),
  $$options: $$accountTerms.trans(R.map(({ id, name }) => ({
    value: id,
    text: name
  }))),
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
  defaultText: '选择车间',
  onchange(department_id) {
    $$queryObj.patch({ department_id });
  },
  $$value: $$queryObj.trans(R.propOr('', 'department_id')),
  $$options: $$departments.trans(R.map(({ id, name, acronym }) => ({
    value: id,
    text: name,
    acronym,
  }))),
});

var filtersVf = function (
  [accountTermDropdown, subjectDropdown, tenantDropdown]
) {
  return h('.filters', [
    accountTermDropdown,
    subjectDropdown,
    tenantDropdown,
  ]);
};

var $$totalPriceOth = $$myOth({
  label: '总价(元)',
  column: 'total_price',
});

var $$dateOth = $$myOth({
  label: '日期',
  column: 'date'
});

var $$accountTermOth = $$myOth({
  label: '账期',
  column: 'account_term_id'
});

var $$filters = $$.connect(
  [$$accountTermDropdown, $$subjectDropdown, $$tenantDropdown], filtersVf
);

var tableVf = function ([totalPriceOth, dateOth, accountTermOth, list]) {
  return h('table.table.compact.striped', [
    h('thead', [
      h('tr', [
        h('th', 'id'),
        h('th', '编号'),
        h('th', '科目'),
        h('th', '车间'),
        h('th', '数量'),
        h('th', '单价(元)'),
        totalPriceOth,
        h('th', '发票'),
        dateOth,
        accountTermOth,
      ])
    ]),
    h('tbody', list.map(function (record) {
      return h('tr', [
        h('td', h('a', {
          href: '/store-order/' + record.id,
        }, '' + record.id)),
        h('td', record.number),
        h('td', record.storeSubject.name),
        h('td', record.department.name),
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
          invoice => h('a', {
            href: '/invoice/' + invoice.id,
          }, invoice.number),
          R.always('--')
        )(record.invoice)),
        h('td', moment(record.date).format('YYYY-MM-DD')),
        h('td', record.accountTerm.name),
      ]);
    }))
  ]);
};

var $$table = $$.connect(
  [$$totalPriceOth, $$dateOth, $$accountTermOth, $$list], tableVf
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

var $$numberSearchBox = $$searchBox({
  minLen: 2,
  defaultText: '搜索编号',
  $$searchText: $$queryObj.trans(R.propOr('', 'number__like')),
  onsearch(number__like) {
    $$queryObj.patch({ number__like, page: 1 });
  },
  getHints(text) {
    return storeOrderStore.getHints(text);
  }
});

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
          }), $$numberSearchBox], contentVf
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
      departmentStore.list,
      accountTermStore.list,
    ])
    .then(function (
      [{ STORE_ORDER_DIRECTIONS, STORE_SUBJECT_TYPES }, storeSubjects,
        { totalCnt, data }, departments, accountTerms]
    ) {
      $$.update(
        [$$loading, false],
        [$$storeSubjectTypes, STORE_SUBJECT_TYPES],
        [$$storeOrderDirections, STORE_ORDER_DIRECTIONS],
        [$$storeSubjects, storeSubjects],
        [$$list, data],
        [$$totalCnt, totalCnt],
        [$$departments, departments],
        [$$accountTerms, accountTerms]
      );
    });
  }
};
