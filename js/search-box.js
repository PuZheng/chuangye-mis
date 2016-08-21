import virtualDom from 'virtual-dom';
var h = virtualDom.h;

const UP = 38;
const DOWN = 40;
const ENTER = 13;

export var searchBox = function (
  {
    defaultText, 
    searchText='', 
    oninput, 
    onsearch, 
    loading,
    options,
    selection,
    minLen=1, 
    onselect, 
    optionContent=function (o, searchText) {
      let pos = o.indexOf(searchText);
      let content = [];
      if (pos == -1) {
        return o;
      }
      if (pos > 0) {
        content.push(o.slice(0, pos));
      }
      content.push(h('.span.color-accent.inline', o.slice(pos, pos + searchText.length)));
      if (pos + searchText.length < o.length) {
        content.push(o.slice(pos + searchText.length));
      }
      return content;
    },
    active,
    onfocus
  }
) {
  return h('.search-box' + (loading? '.loading': ''), [
    h('i.icon.fa.fa-search'),
    h('input.search', {
      tabIndex: 0,
      oninput(e) {
        oninput(this.value);
        return false;
      },
      value: searchText,
      placeholder: defaultText,
      onkeydown(e) {
        console.log(e.which);
        if (e.which == UP || e.keyCode == UP) {
          if (selection > 0) {
            onselect(selection - 1);
            return false;
          }
        }
        if (e.which == DOWN || e.keyCode == DOWN) {
          if (selection < (options || []).length - 1) {
            onselect(selection + 1);
            return false;
          }
        }
        if (e.which == ENTER || e.keyCode == ENTER) {
          selection = options[selection];
          onsearch(selection || searchText);
          return false;
        }
      }
    }),
    function () {
      let classNames = '.results';
      let children;
      // only when search box is:
      //     1. active
      //     2. length of search text > minimum required. 
      //     3. no options
      // we will show "no hints"
      if (!options || options.length == 0) {
        if (searchText.length > minLen && active) {
          classNames += '.visible.transition';
          children = h('.message.c2', '没有搜索结果...');
        }
      } else {
        classNames += '.visible.transition';
        children = options.map(function (o, idx) {
          return h('.item' + (idx == selection? '.selected': ''), {
            onclick(e) {
              oninput(o);
              onsearch(o);
              return false;
            }
          }, optionContent(o, searchText));
        });
      }
      return h(classNames, children);
    }(),
  ]);
};


