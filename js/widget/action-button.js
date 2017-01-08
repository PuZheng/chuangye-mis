import { h } from 'virtual-dom';
import $$ from 'slot';

var $$actionButton = function ({ items, defaultActionIdx=0, ontrigger }) {
  let $$open = $$('', 'open');
  let vf = function ([open]) {
    return h('._.action-button' + open, [
      h('button.default', {
        onclick() {
          ontrigger.apply(null, [items[defaultActionIdx], defaultActionIdx]);
          $$open.val('');
        }
      }, items[defaultActionIdx]),
      h('button.toggle', {
        onclick() {
          $$open.val({
            '': '.open',
            '.open': ''
          }[open]);
          return false;
        }
      }, h('i.fa.fa-caret-down')),
      h('.menu', items.map(function (it, idx) {
        if (idx != defaultActionIdx) {
          return h('.item', {
            onclick() {
              ontrigger.apply(null, [it, idx]);
              $$open.val('');
            }
          }, it);
        }
      })),
    ]);
  };
  return $$.connect([$$open], vf);
};

export default $$actionButton;
