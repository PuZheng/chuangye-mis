import virtualDom from 'virtual-dom';
import classNames from './class-names';

var h = virtualDom.h;
var oth = function ({label, order, onchange}) {
  order = order || '';
  return h('th.oth.c1', [
    label,
    h('i' + classNames('fa', {
      '': 'fa-sort',
      'asc': 'fa-sort-asc',
      'desc': 'fa-sort-desc'
    }[order]), {
      onclick: function () {
        onchange({
          '': 'asc',
          'desc': 'asc',
          'asc': 'desc'
        }[order]);
      }
    }),
  ]);
};

export default oth;
