import $$ from './xx.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

export var dropdown = function dropdown({defaultText='', options=[], value, activated, onactivate, onchange}) {
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
  options = options.map( o => h('.item' + (o.value == value? '.item-selected': ''), {
    onclick: function () {
      onchange(o.value, o);
    }
  }, o.text) );
  if (options.length == 0) {
    options = [h('.message', '没有可选项')];
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
      if (option.value === value) {
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
        onsearch('');
        onactivate(false);
        return false;
      }
    }),
    h('.text' + function () {
      let classNames = selectedOption? '': '.text-default';
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
