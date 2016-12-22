import $$ from 'slot';
import classNames from './class-names.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

export var $$toast = $$(null, 'toast');

var $$view = $$.connect([$$toast], function ([toast]) {
  if (!toast) return h('div');
  let ret = h(
    classNames('toast', 'bg-' + toast.type || 'info', 'center'), {
      hook: new class Hook {
        hook(el) {
          // we must setTimeout here, otherwise dom will be not inserted
          // into dom tree
          setTimeout(function () {
            el.className = el.className.replace(/\bfade-out\b/, '');
            if (!el.className.match(/\bfade-in\b/)) {
              el.className += ' fade-in';
            }
            setTimeout(function () {
              el.className = el.className.replace(/\bfade-in\b/, 'fade-out');
            }, toast.duration || 2000);
          }, 0);
        }
      },
      style: {
        color: 'white',
      }
    }, toast.message
  );
  return ret;
});


export default {
  page: {
    $$view,
  },
  $$toast,
};
