import $$ from '../xx';
import virtualDom from 'virtual-dom';
import oth from '../oth';
import classNames from '../class-names';
import R from 'ramda';
import page from 'page';
import $$queryObj from '../query-obj';

var h = virtualDom.h;
var $$loading = $$(false, 'loading');
var $$list = $$([], 'list');

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


var valueFunc = function valueFunc(loading, list, idOth, dateOth) {
  return h('table#invoice-list' + classNames('striped', 'compact', 'relative', 'color-gray-dark', loading && 'loading'), [
    h('thead', [
      h('tr', [
        idOth,
        h('th', '发票类型'),
        dateOth,
        h('th', '编号'),
        h('th', '帐期'),
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
              href: '/invoice/object/' + it.id,
              onclick: function (e) {
                page('/invoice/object' + it.id);
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
  ]);
};

var $$view = $$.connect([$$loading, $$list, $$idOth, $$dateOth],
                        valueFunc);

export default {
  page: { $$view },
  $$list,
  $$loading,
};
