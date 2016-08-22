import $$ from '../xx';
import virtualDom from 'virtual-dom';
import pagination from '../pagination';
var h = virtualDom.h;

export var $$tableHints = function (
  {$$totalCnt, $$queryObj, pageSize}
) {
  return $$.connect([$$totalCnt, $$queryObj], function (totalCnt, queryObj) {
    return h('.table-hints', [
      h('span', '符合条件的记录: '),
      h('span.record-no', '' + totalCnt),
      ', 分',
      h('span.page-no', '' + pagination({
        totalCnt,
        page: queryObj.page,
        pageSize,
      }).totalPageCnt),
      h('span', '页')
    ]);
  });
};

export default $$tableHints;
