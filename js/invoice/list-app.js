import $$ from '../xx';
import virtualDom from 'virtual-dom';
import oth from '../oth';
import classNames from '../class-names';
import page from 'page';
import $$queryObj from '../query-obj';
import config from '../config.js';
import { $$invoiceTypes, $$accountTerms, $$entities } from './data-slots';
import { $$filters } from './list-filters';
import getColOrder from '../get-col-order';
import $$tableHints from '../widget/table-hints';
import $$paginator from '../widget/paginator';

var h = virtualDom.h;
var $$loading = $$(false, 'loading');
var $$list = $$([], 'list');
var $$totalCnt = $$('', 'total-cnt');


var $$idOth = $$.connect([$$queryObj], function (queryObj) {
  let order = getColOrder('id', queryObj);
  return oth({
    label: 'id', 
    order, 
    onchange(order) {
      $$queryObj.patch({
        sort_by: 'id.' + order,
      });
    },
  });
});

var $$dateOth = $$.connect([$$queryObj], function (queryObj) {
  let order = getColOrder('date', queryObj);
  return oth({
    label: '日期', 
    order, 
    onchange(order) {
      $$queryObj.patch({
        sort_by: 'date.' + order,
      });
    }
  });
});

var $$accountTermOth = $$.connect([$$queryObj], function (queryObj) {
  let order = getColOrder('account_term', queryObj);
  return oth({
    label: '帐期', 
    order, 
    onchange(order) {
      $$queryObj.patch({
        sort_by: 'account_term.' + order,
      });
    }
  });
});

var valueFunc = function valueFunc(
  loading, list, idOth, dateOth, totalCnt, paginator, tableHints, filters,
  accountTermOth
) {
  return h('.list-app', [
    h('.header', '发票列表'),
    filters,
    h('table#invoice-list' + classNames('striped', 'compact', 'relative', 'color-gray-dark', loading && 'loading'), [
      h('thead', [
        h('tr', [
          idOth,
          h('th', '发票类型'),
          dateOth,
          h('th', '编号'),
          accountTermOth,
          h('th', '是否增值税'),
          h('th', '销售方'),
          h('th', '购买方'),
          h('th', '经办人'),
        ]),
      ]),
      h('tbody', [
        list.map(function (it) {
          return h('tr', [
            h('td', [
              h('a', {
                href: '/invoice/' + it.id,
                onclick: function () {
                  page('/invoice/' + it.id);
                  return false;
                },
              }, it.id),
            ]),
            h('td', it.invoiceType.name),
            h('td', it.date),
            h('td', it.number),
            h('td', it.accountTerm.name),
            h('td', [
              h('i' + classNames('fa', it.isVat? 'fa-check': 'fa-remove', it.isVat? 'color-success': 'color-gray')),
            ]),
            h('td', (it.vendor || {}).name || '--'),
            h('td', (it.purchaser || {}).name || '--'),
            h('td', it.creator.username),
          ]);
        })
      ]),
    ]),
    tableHints,
    h('.paginator-container', paginator)
  ]);
};

var $$view = $$.connect([
  $$loading, $$list, $$idOth, 
  $$dateOth, $$totalCnt, $$paginator({
    $$totalCnt,
    $$queryObj,
    pageSize: config.getPageSize('invoice'),
  }), $$tableHints({
    $$totalCnt,
    $$queryObj,
    pageSize: config.getPageSize('invoice'),
  }), $$filters, 
  $$accountTermOth], 
  valueFunc);

export default {
  page: { $$view },
  $$list,
  $$loading,
  $$totalCnt,
  $$invoiceTypes,
  $$accountTerms,
  $$entities
};
