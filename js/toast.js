import $$ from 'slot';
import classNames from './class-names.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

export var $$toast = $$(null, 'toast');

$$toast.change(function (toast) {
  if (toast) {
    setTimeout(function () {
      $$toast.val(null);
    }, 3000);
  }
});

var $$view = $$.connect([$$toast], function ([toast]) {
  return toast? h(classNames('bg-' + toast.type || 'info', 'p2', 'center', 'color-gray-dark'), toast.message): h('');   
});

export default {
  page: {
    $$view,
  },
  $$toast,
};
