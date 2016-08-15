import virtualDom from 'virtual-dom';
var h = virtualDom.h;

export var match = function match(option, searchText) {
  return ~option.text.indexOf(searchText) || ~option.acronym.indexOf(searchText);
};

export var optionContent = function optionContent(option, searchText) {
  if (!searchText) {
    return option.text;
  }
  let pos = option.text.indexOf(searchText);
  if (pos === -1) {
    pos = option.acronym.indexOf(searchText);
  }
  // not matched
  if (pos === -1) {
    return '';
  }
  let ret = [];
  if (pos > 0) {
    ret.push(option.text.slice(0, pos));
  }
  ret.push(h('span.color-accent', option.text.slice(pos, searchText.length)));
  if (pos + searchText.length < option.text.length) {
    ret.push(option.text.slice(pos + searchText.length, option.text.length));
  }
  return ret;
};
