import $$ from './xx.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

const ESC = 27;

var parents = function parents(el, filter) {
  const matchesSelector = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector;

  // match start from parent
  el = el.parentElement;
  while (el && !matchesSelector.call(el, filter)) {
    el = el.parentElement;
  }
  return el;
};

export var dropdown = function dropdown({defaultText='', options=[], value, activated, onactivate, onchange}) {
  let classNames = ['dropdown'];
  if (activated) {
    classNames.push('dropdown-activated');
  }
  classNames = classNames.map( c => '.' + c ).join('');
  let selectedOption;
  if (value != 'undefined') {
    for (var option of options) {
      if (option.value == value) {
        selectedOption = option;
        break;
      }
    }
  }
  options = options.map( o => h('.item' + (o.value == value? '.item-selected': ''), {
    onclick: function () {
      onchange(o.value, o);
      parents(this, '.dropdown').blur();
      return false;
    },
  }, o.text) );
  if (options.length == 0) {
    options = [h('.message', '没有可选项')];
  }
  return h(classNames, {
    // a div with tabIndex could be focused/blured
    tabIndex: 0,
    onfocus: function () {
      onactivate(true);
      return false;
    },
    onblur: function () {
      onactivate(false);
      return false;
    },
    onkeydown: function (e) {
      if (e.which === ESC || e.keyCode === ESC) {
        onactivate(false);
        return false;
      }
    },
  }, [
    h('i.icon.fa.fa-caret-down'),
    h('.text' + (selectedOption? '': '.default'), selectedOption? selectedOption.text: defaultText),
    h('.menu', options)
  ]);
};

export var searchDropdown = function ({
  defaultText='', searchText='', options=[], value, 
    activated, onactivate, onchange, onsearch, match, 
  optionContent}) {
  let classNames = ['dropdown', 'dropdown-search'];
  if (activated) {
    classNames.push('dropdown-activated');
  }
  classNames = classNames.map( c => '.' + c ).join('');
  let selectedOption;
  if (value != 'undefined') {
    for (var option of options) {
      if (option.value == value) {
        selectedOption = option;
        break;
      }
    }
  }
  optionContent = optionContent || function (o) {
    return o.text;
  };
  if (options && options.length) {
    options = options.map(function (o) {
      let classNames = ['item'];
      (o.value == value) && classNames.push('item-selected');
      let filtered = searchText && !match(o, searchText);
      filtered && classNames.push('filtered');
      classNames = classNames.map( c => '.' + c ).join('');
      return h(classNames, {
        dataFiltered: filtered,
        // note!!!, don't use onclick, since onclick event fired after input.search's onblur
        onmousedown: function (e) {
          onchange(o.value, o);
        },
      }, optionContent(o));
    });
  }
  if (options.length == 0 || options.every( o => o.properties.dataFiltered )) {
    options = [h('.message', '没有可选项')];
  }
  return h(classNames, {
    // a div with tabIndex could be focused/blured
  }, [
    h('i.icon.fa.fa-caret-down'),
    h('input.search', {
      tabIndex: 0,
      value: searchText,
      oninput: function (e) {
        onsearch(this.value);
      },
      onfocus: function () {
        onactivate(true);
        return false;
      },
      onblur: function (e) {
        onsearch('');
        onactivate(false);
        return false;
      },
      onkeydown: function (e) {
        if (e.which === ESC || e.keyCode === ESC) {
          onactivate(false);
          this.blur();
          return false;
        }
      },
    }),
    h('.text' + function () {
      let classNames = selectedOption? '': '.default';
      if (searchText) {
        classNames += '.filtered';
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
