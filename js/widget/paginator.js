import virtualDom from 'virtual-dom';
import $$ from 'slot';
import pagination from '../pagination';

var h = virtualDom.h;

export var $$paginator = function (
  {$$totalCnt, $$queryObj, pageSize}
) {
  let vf = function ([totalCnt, queryObj]) {
    let pg = pagination({
      totalCnt,
      page: queryObj.page || 1,
      pageSize,
    });
    return h('.paginator.menu', [
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
          $$queryObj.patch({
            page: Number(queryObj.page) - 1,
          });
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
          $$queryObj.patch({
            page: Number(queryObj.page || 1) + 1,
          });
          return false;
        }
      }, [
        h('i.fa.fa-lg.fa-angle-right'),
      ]),
    ]);
  };
  return $$.connect([$$totalCnt, $$queryObj], vf);
};
export default $$paginator;
