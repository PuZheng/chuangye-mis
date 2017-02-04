import { h } from 'virtual-dom';
import $$ from 'slot';
import pagination from '../pagination';

export var $$paginator = function (
  {$$totalCnt, $$page, $$pageSize, onNavigate}
) {
  let vf = function ([totalCnt, page, pageSize]) {
    let pg = pagination({
      totalCnt,
      page: page || 1,
      pageSize,
    });
    return h('.paginator._.menu', [
      h('a' + function () {
        let s = '.item.celled';
        if (!pg.hasPrev) {
          s += '.disabled';
        }
        return s;
      }(), {
        href: '#',
        title: '上一页',
        onclick() {
          onNavigate(Number(page) - 1);
          return false;
        }
      }, [
        h('i.fa.fa-lg.fa-angle-left'),
      ]),
      h('.item.celled', '' + pg.page),
      h('a' + function () {
        let s = '.item.celled';
        if (!pg.hasNext) {
          s += '.disabled';
        }
        return s;
      }(), {
        href: '#',
        title: '下一页',
        onclick() {
          onNavigate(Number(page || 1) + 1);
          return false;
        }
      }, [
        h('i.fa.fa-lg.fa-angle-right'),
      ]),
    ]);
  };
  return $$.connect([$$totalCnt, $$page, $$pageSize], vf);
};
export default $$paginator;
