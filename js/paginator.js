import virtualDom from 'virtual-dom';
import classNames from './class-names';

var h = virtualDom.h;

var paginator = function (pagination, goPrev, goNext) {
  return h('.menu', [
    h('a' + classNames('item', 'celled', !pagination.hasPrev && '.disabled'), {
      href: '#',
      title: '上一页',
      onclick(e) {
        goPrev();
        return false;
      }
    }, [
      h('i.fa.fa-lg.fa-angle-left'),
    ]),
    h('.item.celled', '' + pagination.page),
    h('a' + classNames('item', 'celled', !pagination.hasNext && '.disabled'), {
      href: '#',
      title: '下一页',
      onclick(e) {
        goNext();
        return false;
      }
    }, [
      h('i.fa.fa-lg.fa-angle-right'),
    ]),
  ]);
};

export default paginator;
