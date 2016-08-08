import $$ from './xx.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

var dropdown = function ({defaultText='', options=[], value, activated, onactivate, onchange}) {
  let classNames = ['dropdown'];
  if (activated) {
    classNames.push('dropdown-activated');
  }
  classNames = classNames.map( c => '.' + c ).join('');
  let selectedOption;
  if (value != 'undefined') {
    for (var option of options) {
      if (option.value === value) {
        selectedOption = option;
        break;
      }
    }
  }
  return h(classNames, {
    onclick: function () {
      onactivate(!activated);
    },
    onblur: function () {
      alert('ok');
    }
  }, [
    h('i.icon.fa.fa-caret-down'),
    h('.text' + (selectedOption? '': '.text-default'), selectedOption? selectedOption.text: defaultText),
    h('.menu', options.map( o => h('.item' + (o.value == value? '.item-selected': ''), {
      onclick: function () {
        onchange(o.value, o);
      }
    }, o.text) ))
  ]);
};

export default dropdown;
