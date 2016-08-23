import virtualDom from 'virtual-dom';
import $$ from './xx';
import R from 'ramda';
import classNames from './class-names';

var h = virtualDom.h;
var $$content = $$({}, 'content'); 
let vf = function (content) {
  if (R.isEmpty(content)) {

  }
  return h(classNames('overlay', !R.isEmpty(content) && 'open', content.type || '', content.className || ''), [
    h('button.close-btn', {
      onclick() {
        $$content.val({});
      }
    }, [
      h('i.fa.fa-remove.fa-4x'),
    ]),
    h('.title', content.title),
    h('.message', content.message),
  ]);  
};

const ESC = 27;

export default {
  page: {
    $$view: $$content.trans(c => vf(c)),
    onMount: function () {
      document.addEventListener('keydown', function (e) {
        if (e.which == ESC || e.keyCode == ESC) {
          if (!R.isEmpty($$content.val())) {
            $$content.val({});
            e.preventDefault();
          }
        }
      });
    },
  },
  $$content,
};
