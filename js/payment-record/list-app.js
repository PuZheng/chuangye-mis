import $$ from 'slot';
import virtualDom from 'virtual-dom';
import $$tableHints from 'widget/table-hints';
import $$queryObj from '../query-obj';
import config from '../config';
import $$paginator from 'widget/paginator';
import moment from 'moment';
import R from 'ramda';
import paymentRecordStore from 'store/payment-record-store';

var { h } = virtualDom;

var $$totalCnt = $$(0, 'total-cnt');
var $$loading = $$(false, 'loading');
var $$list = $$([], 'list');


var vf = function vf([loading, filters, table, tableHints, paginator]) {
  return h('.list-app' + (loading? '.loading': ''), [
    h('.header', [
      h('.title', '扣费记录列表'),
    ]),
    filters,
    table,
    tableHints,
    h('.paginator-container', paginator)
  ]);
};

var filtersVf = function filtersVf() {

};

var tableVf = function tableVf([list]) {
  return h('table.compact.striped', [
    h('thead', h('tr', [

      h('th', 'id'),
      h('th', '车间'),
      h('th', '金额(元)'),
      h('th', '税金(元)'),
      h('th', '日期'),
      h('th', '状态'),
      h('th', '支付凭证'),
      h('th', '类型'),
      h('th', '操作'),
    ])),
    h('tbody', list.map(function (it) {
      return h('tr', [
        h('td', h('a', {
          href: '/payment-record/object/' + it.id,
        }, it.id)),
        h('td', it.department.name),
        h('td', String(it.amount)),
        h('td', String(it.tax)),
        h('td', moment(it.created).format('YY-MM-DD')),
        h('td', it.status),
        h('td', R.ifElse(
          R.prop('voucherId'),
          paymentRecord => h('a', {
            href: '/voucher/object' + paymentRecord.voucherId,
          }, paymentRecord.voucher.number),
          R.always('--')
        )(it)),
        h('td', it.type),
        // h('td', it.actions),
      ]);
    })),
  ]);
};

var $$filters = $$.connect([], filtersVf);
var $$table = $$.connect([$$list], tableVf);

export default {
  page: {
    get $$view() {
      return $$.connect([$$loading, $$filters, $$table, $$tableHints({
        $$totalCnt,
        $$queryObj,
        pageSize: config.getPageSize('paymentRecord')
      }), $$paginator({
        $$totalCnt,
        $$queryObj,
        pageSize: config.getPageSize('paymentRecord')
      })], vf);
    },
  },
  init(ctx) {
    $$loading.on();
    paymentRecordStore.fetchList(ctx.query)
    .then(function ({ totalCnt, data }) {
      $$.update(
        [$$loading, false],
        [$$totalCnt, totalCnt],
        [$$list, data]
      );
    });
  }
};
