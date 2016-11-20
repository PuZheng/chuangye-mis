import virtualDom from 'virtual-dom';
import $$ from 'slot';
import R from 'ramda';
import classNames from './class-names';

var h = virtualDom.h;
var $$content = $$({}, 'content');

let vf = function (content) {
  content = content || {};
  return h(
    classNames('overlay',
               !R.isEmpty(content) && 'open', content.type || '',
               content.className || '', content.cancelable && 'cancelable'),
    [
      h('button.close-btn', {
        onclick() {
          $$content.val({});
        }
      }, [
        h('i.fa.fa-remove.fa-4x'),
      ]),
      h('.title', content.title),
      h('.message', content.message),
    ]
  );
};

const ESC = 27;

export default {
  page: {
    $$view: $$content.trans(c => vf(c)),
    onMount: function () {
      document.addEventListener('keydown', function (e) {
        if (!$$content.val().cancelable) {
          return false;
        }
        if (e.which == ESC || e.keyCode == ESC) {
          if (!R.isEmpty($$content.val())) {
            $$content.val({});
            e.preventDefault();
          }
        }
      });
    },
  },
  show(args) {
    if (args.cancelable === void 0) {
      args.cancelable = true;
    }
    $$content.val(args);
  },
  dismiss() {
    $$content.val(null);
  },
  $$content,
};
