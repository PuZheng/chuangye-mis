import $$ from 'slot';
import virtualDom from 'virtual-dom';
import classNames from '../class-names';
import page from 'page';
import $$queryObj from '../query-obj';
import config from '../config';
import $$tableHints from '../widget/table-hints';
import $$paginator from '../widget/paginator';
import invoiceStore from 'store/invoice-store';
import invoiceTypeStore from 'store/invoice-type-store';
import accountTermStore from 'store/account-term-store';
import entityStore from 'store/entity-store';
import $$searchBox from '../widget/search-box';
import R from 'ramda';
import $$myOth from 'widget/my-oth';
import constStore from 'store/const-store';
import $$dropdown from '../widget/dropdown';
import $$searchDropdown from '../widget/search-dropdown';

var h = virtualDom.h;
var $$loading = $$(false, 'loading');
var $$list = $$([], 'list');
var $$totalCnt = $$('', 'total-cnt');
var $$invoiceStatus = $$({}, 'invoice-status');
var $$invoiceTypes = $$([], 'invoice-types');
var $$accountTerms = $$([], 'account-terms');
var $$entities = $$([], 'entities');

var $$idOth = $$myOth({
  label: '编号',
  column: 'id'
});

var $$dateOth = $$myOth({
  label: '日期',
  column: 'date',
});

var $$accountTermOth = $$myOth({
  label: '账期',
  column: 'account_term',
});

var $$amountOth = $$myOth({
  label: '金额(元)',
  column: 'amount',
});

var vf = function vf(
  [loading, paginator, tableHints, filters, table, numberSearchBox]
) {
  return h(classNames('list-app', loading && 'loading'), [
    h('.header', [
      h('.title', '发票列表'),
      h('button.new-btn', {
        onclick() {
          page('/invoice');
        }
      }, h('i.fa.fa-plus')),
      h('.search', numberSearchBox),
    ]),
    filters,
    table,
    tableHints,
    h('.paginator-container', paginator)
  ]);
};

var tableVf = function (
  [idOth, dateOth, accountTermOth, amountOth, list, invoiceStatus]
) {
  return h(
    'table#invoice-list' + classNames('striped', 'compact', 'color-gray-dark'),
    [
      h('thead', [
        h('tr', [
          idOth,
          h('th', '发票类型'),
          dateOth,
          h('th', '编号'),
          amountOth,
          h('th', '税率(百分比)'),
          h('th', '税额(元)'),
          accountTermOth,
          h('th', '状态'),
          h('th', '是否增值税'),
          h('th', '销售方'),
          h('th', '购买方'),
          h('th', '经办人'),
        ]),
      ]),
      h('tbody', [
        list.map(function (it) {
          return h('tr' + classNames(
            it.status === invoiceStatus.ABORTED && 'strikeout'
          ), [
            h('td', [
              h('a', {
                href: '/invoice/' + it.id,
              }, it.id),
            ]),
            h('td', it.invoiceType.name),
            h('td', it.date),
            h('td', it.number),
            h('td', '' + it.amount),
            h('td', R.ifElse(
              R.identity,
              R.concat(''),
              R.always('--')
            )(it.taxRate)),
            h('td', R.ifElse(
              R.prop('taxRate'),
              it => it.taxRate * it.amount / 100 + '',
                R.always('--')
            )(it)),
            h('td', it.accountTerm.name),
            h('td' + classNames(it.status == invoiceStatus.AUTHENTICATED
                                && 'ca'), it.status),
            h('td', [
              h('i' + classNames('fa', it.isVat? 'fa-check': 'fa-remove',
                                 it.isVat? 'color-success': 'color-gray')),
            ]),
            h('td', (it.vendor || {}).name || '--'),
            h('td', (it.purchaser || {}).name || '--'),
            h('td', it.creator.username),
          ]);
        })
      ]),
    ]
  );
};

var $$table = $$.connect(
  [$$idOth, $$dateOth, $$accountTermOth, $$amountOth, $$list, $$invoiceStatus],
  tableVf
);

var $$numberSearchBox = $$searchBox({
  minLen: 2,
  defaultText: '搜索编号',
  $$searchText: $$queryObj.trans(R.propOr('', 'number__like')),
  onsearch(number__like) {
    $$queryObj.patch({ number__like, page: 1 });
  },
  getHints(text) {
    return invoiceStore.getHints(text);
  }
});

var $$invoiceTypeFilter = $$dropdown({
  $$options: $$invoiceTypes.trans(R.map(it => ({
    value: it.id,
    text: it.name
  }))),
  $$value: $$queryObj.trans(R.prop('invoice_type_id')),
  defaultText: '请选择发票类型',
  onchange(invoice_type_id) {
    $$queryObj.patch({ invoice_type_id, });
  }
});

var $$dateFilter = $$dropdown({
  $$options: $$([
    { value: 'in_7_days', text: '7天内' },
    { value: 'in_30_days', text: '30天内' },
  ]),
  $$value: $$queryObj.trans(R.prop('date_span')),
  defaultText: '请选择日期范围',
  onchange(date_span) {
    $$queryObj.patch({ date_span, });
  }
});

var $$accountTermFilter = $$searchDropdown({
  defaultText: '请选择账期',
  $$value: $$queryObj.trans(R.prop('account_term_id')),
  $$options: $$accountTerms.trans(R.map(it => ({
    value: it.id,
    text: it.name,
  }))),
  onchange(account_term_id) {
    $$queryObj.patch({ account_term_id, });
  }
});

var $$vendorFilter = $$searchDropdown({
  defaultText: '请选择销售方',
  $$value: $$queryObj.trans(R.prop('vendor_id')),
  $$options: $$entities.trans(R.map(it => ({
    value: it.id,
    text: it.name,
    acronym: it.acronym
  }))),
  onchange(vendor_id) {
    $$queryObj.patch({ vendor_id });
  }
});

var $$purchaserFilter = $$searchDropdown({
  defaultText: '请选择购买方',
  $$value: $$queryObj.trans(R.prop('purchaser_id')),
  $$options: $$entities.trans(R.map(it => ({
    value: it.id,
    text: it.name,
    acronym: it.acronym
  }))),
  onchange(purchaser_id) {
    $$queryObj.patch({ purchaser_id, });
  },
});

var $$statusFilter = $$dropdown({
  defaultText: '请选择状态',
  $$value: $$queryObj.trans(R.prop('status')),
  $$options: $$invoiceStatus.trans(it => {
    return R.values(it).filter(s => s != it.DELETED);
  }),
  onchange(status) {
    $$queryObj.patch({ status });
  }
});

var $$filters = $$.connect([
  $$invoiceTypeFilter,
  $$dateFilter,
  $$accountTermFilter,
  $$vendorFilter,
  $$purchaserFilter,
  $$statusFilter,
], function ([
  invoiceTypeFilter, dateFilter, accountTermFilter, vendorFilter,
  purchaserFilter, statusFilter
]) {
  return h('.filters', [
    invoiceTypeFilter,
    dateFilter,
    accountTermFilter,
    vendorFilter,
    purchaserFilter,
    statusFilter,
  ]);
});

var $$view = $$.connect([
  $$loading,
  $$paginator({
    $$totalCnt,
    $$queryObj,
    pageSize: config.getPageSize('invoice'),
  }),
  $$tableHints({
    $$totalCnt,
    $$queryObj,
    pageSize: config.getPageSize('invoice'),
  }), $$filters, $$table, $$numberSearchBox,
],
vf);

export default {
  page: { $$view },
  init() {
    $$loading.toggle();
    Promise.all([
      invoiceStore.fetchList($$queryObj.val()),
      invoiceTypeStore.list,
      accountTermStore.list,
      entityStore.fetchList(),
      constStore.get(),
    ]).then(function ([data, invoiceTypes, accountTerms, entities,
                      { invoiceStatus }]) {
      $$.update(
        [$$loading, false],
        [$$list, data.data],
        [$$totalCnt, data.totalCnt],
        [$$invoiceTypes, invoiceTypes],
        [$$accountTerms, accountTerms],
        [$$entities, entities],
        [$$invoiceStatus, invoiceStatus]
      );
    });
  }
};
