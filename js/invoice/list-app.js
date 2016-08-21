import $$ from '../xx';
import virtualDom from 'virtual-dom';
import oth from '../oth';
import classNames from '../class-names';
import page from 'page';
import $$queryObj from '../query-obj';
import paginator from '../paginator';
import config from '../config.js';
import pagination from '../pagination';
import { $$invoiceTypes, $$accountTerms, $$entities } from './data-slots';
import { $$filters } from './list-filters';

var h = virtualDom.h;
var $$loading = $$(false, 'loading');
var $$list = $$([], 'list');
var $$totalCnt = $$('', 'total-cnt');

var getColOrder = function getColOrder(colName, query) {
  if (!query.sort_by) {
    return '';
  }
  let [sortByCol, order] = query.sort_by.split('.');
  if (sortByCol == colName) {
    return order || 'asc';
  } else {
    return '';
  }
};

var $$idOth = $$.connect([$$queryObj], function (queryObj) {
  let order = getColOrder('id', queryObj);
  return oth('id', order, function (order) {
    $$queryObj.patch({
      sort_by: 'id.' + order,
    });
  });
});

var $$dateOth = $$.connect([$$queryObj], function (queryObj) {
  let order = getColOrder('date', queryObj);
  return oth('日期', order, function (order) {
    $$queryObj.patch({
      sort_by: 'date.' + order,
    });
  });
});

var $$accountTermOth = $$.connect([$$queryObj], function (queryObj) {
  let order = getColOrder('account_term', queryObj);
  return oth('帐期', order, function (order) {
    $$queryObj.patch({
      sort_by: 'account_term.' + order,
    });
  });
});

var $$paginator = $$.connect([
  $$totalCnt, $$queryObj], function (totalCnt, queryObj) {
  return paginator(pagination({
    totalCnt,
    page: queryObj.page || 1,
    pageSize: config.getPageSize('invoice'),
  }), function goPrev() {
    $$queryObj.patch({
      page: Number(queryObj.page) - 1,
    });
  }, function goNext() {
    $$queryObj.patch({
      page: Number(queryObj.page) + 1,
    });
  });
});

var $$tableHints = $$.connect([$$totalCnt, $$queryObj], function (totalCnt, queryObj) {
  return h('.hints', [
    h('span', '符合条件的记录: '),
    h('span.record-no', totalCnt),
    ', 分',
    h('span.page-no', '' + pagination({
      totalCnt,
      page: queryObj.page,
      pageSize: config.getPageSize('invoice'),
    }).totalPageCnt),
    h('span', '页')
  ]);
});


var valueFunc = function valueFunc(
  loading, list, idOth, dateOth, totalCnt, paginator, tableHints, filters,
  accountTermOth
) {
  return h('.list-app', [
    h('h3.header', '发票列表'),
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
    h('.paginator', paginator),
  ]);
};

var $$view = $$.connect([
  $$loading, $$list, $$idOth, 
  $$dateOth, $$totalCnt, $$paginator, $$tableHints, $$filters, 
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
