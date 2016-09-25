import $$ from 'slot';
import virtualDom from 'virtual-dom';
import classNames from '../class-names';

var h = virtualDom.h;

var $$oth = function ({ label, $$order, onchange }) {
  return $$.connect([$$order], function ([order]) {
    order = order || '';
    return h('th.oth.c1', {
      onclick: function () {
        onchange({
          '': 'asc',
          'desc': 'asc',
          'asc': 'desc'
        }[order]);
      }
    }, [
      label,
      h('i' + classNames('fa', {
        '': 'fa-sort',
        'asc': 'fa-sort-asc',
        'desc': 'fa-sort-desc'
      }[order])),
    ]);
  });
};

export default $$oth;
