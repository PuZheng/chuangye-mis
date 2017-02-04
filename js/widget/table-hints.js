import $$ from 'slot';
import { h } from 'virtual-dom';
import pagination from '../pagination';

export var $$tableHints = function (
  {$$totalCnt, $$page, $$pageSize}
) {
  return $$.connect(
    [$$totalCnt, $$page, $$pageSize],
    function ([totalCnt, page, pageSize]) {
      return h('.table-hints', [
        h('span', '符合条件的记录: '),
        h('span.record-no', '' + totalCnt),
        ', 分',
        h('span.page-no', '' + pagination({
          totalCnt,
          page: page,
          pageSize,
        }).totalPageCnt),
        h('span', '页')
      ]);
    }
  );
};

export default $$tableHints;
