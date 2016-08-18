import $$ from '../xx';
import virtualDom from 'virtual-dom';
import oth from '../oth';
import classNames from '../class-names';

var h = virtualDom.h;
var $$loading = $$(false, 'loading');
var $$list = $$([], 'list');
var $$idOth = function () {
  let $$order = $$('', 'id-order');
  var onchange = function onchange(order) {
    $$order.val(order);
  };
  return $$.connect([$$order], function (order) {
    return oth('id', order, onchange);
  });
}();

var $$dateOth = function () {
  let $$order = $$('', 'date-order');
  var onchange = function onchange(order) {
    $$order.val(order);
  };
  return $$.connect([$$order], function (order) {
    return oth('日期', order, onchange);
  });
}();


var valueFunc = function valueFunc(loading, list, idOth, dateOth) {
  return h('table#invoice-list' + classNames('striped', 'compact', 'relative', loading && 'loading'), [
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
          ])
        ]);
      })
    ]),
  ]);
};

var $$view = $$.connect([$$loading, $$list, $$idOth, $$dateOth],
                        valueFunc);

export var page = {
  $$view,
};

export default {
  page,
  $$list,
  $$loading,
};
