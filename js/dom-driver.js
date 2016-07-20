import snabbdom from 'snabbdom';
import class_ from 'snabbdom/modules/class';
import props from 'snabbdom/modules/props';
import style from 'snabbdom/modules/style';
import eventlisteners from 'snabbdom/modules/eventlisteners';

const patch = snabbdom.init([    
  class_,
  props,
  style,
  eventlisteners
]);

var oldVnode;
export function mount(slot, node, cb) {
  slot.change((vnode) => {
    patch(oldVnode || node, vnode);
    oldVnode = vnode;
  });
};

