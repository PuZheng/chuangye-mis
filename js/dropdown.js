import $$ from './xx.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

export var dropdown = function ({defaultText='', options=[], value, activated, onactivate, onchange}) {
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
    // a div with tabIndex could be focused/blured
    tabIndex: 0,
    onclick: function () {
      onactivate(!activated);
    },
    onblur: function () {
      onactivate(false);
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

export var searchDropdown = function ({defaultText='', searchText='', options=[], value, activated, onactivate, onchange, onsearch, match}) {
  let classNames = ['dropdown', 'dropdown-search'];
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
  if (options && options.length) {
    options = options.map(function (o) {
      let classNames = ['item'];
      (o.value == value) && classNames.push('item-selected');
      match(o, searchText) && classNames.push('item-filtered');
      return h('.item' + (o.value == value? '.item-selected': ''), {
        // note!!!, don't use onclick, since onclick event fired after input.search's onblur
        onmousedown: function (e) {
          onchange(o.value, o);
        },
      }, o.text);
    });
  } else {
    options = [h('.message', '没有可选项')];
  }
  return h(classNames, {
    // a div with tabIndex could be focused/blured
    onclick: function (e) {
      onactivate(!activated);
      return false;
    },
  }, [
    h('i.icon.fa.fa-caret-down'),
    h('input.search', {
      tabIndex: 0,
      value: searchText,
      oninput: function (e) {
        onsearch(this.value);
      },
      onblur: function (e) {
        onactivate(false);
        return false;
      }
    }),
    h('.text' + function () {
      let classNames = selectedOption? '': '.text-default';
      if (searchText) {
        classNames += '.text-filtered';
      }
      return classNames;
    }(), selectedOption? selectedOption.text: defaultText),
    h('.menu', options)
  ]);

};

export default {
  dropdown,
  searchDropdown
};
