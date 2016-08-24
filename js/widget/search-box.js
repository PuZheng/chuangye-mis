import $$ from '../xx';
import virtualDom from 'virtual-dom';

const UP = 38;
const DOWN = 40;
const ENTER = 13;
const ESC = 27;

var h = virtualDom.h;

var getText = function (option) {
  if (!option) {
    return '';
  }
  if (typeof option == 'object') {
    return option.text || '';
  }
  return String(option);
};

var getAcronym = function (option) {
  if (typeof option == 'object') {
    return option.acronym || '';
  }
  return '';
};

export var $$searchBox = function (
  {
    defaultText, 
    $$searchText, 
    onsearch, 
    getHints, 
    minLen=1, 
    optionContent=function (o, searchText) {
      let text = getText(o).toUpperCase();
      searchText = searchText.toUpperCase();
      let acronym = getAcronym(o).toUpperCase();
      let pos = text.indexOf(searchText);
      if (pos == -1 && acronym) {
        pos = acronym.indexOf(searchText);
      }
      if (pos == -1) {
        return text;
      }
      let content = [];
      if (pos > 0) {
        content.push(text.slice(0, pos));
      }
      content.push(h('.span.color-accent.inline', text.slice(pos, pos + searchText.length)));
      if (pos + searchText.length < text.length) {
        content.push(text.slice(pos + searchText.length));
      }
      return content;
    },
  }
) {
  let $$selection = $$(-1, 'selection');
  let $$options = $$([], 'options');
  let $$loading = $$(false, 'loading');
  let $$active = $$(false, 'active');
  let valueFunc = function (searchText, loading, options, selection, active) {
    return h('.search-box.small' + (loading? '.loading': ''), [
      h('i.icon.fa.fa-search'),
      h('input.search', {
        tabIndex: 0,
        onfocus() {
          $$active.val(true);
          if (searchText && searchText.length >= minLen) {
            $$loading.val(true);
            getHints(searchText).then(function (hints) {
              $$.update(
                [$$selection, -1],
                [$$options, hints],
                [$$loading, false]
              );
            });
          }
        },
        onblur() {
          $$.update(
            [$$active, false],
            [$$options, []],
            [$$loading, false]
          );
        },
        oninput() {
          $$.update(
            [$$searchText, this.value],
            [$$selection, -1]
          );
          if (this.value.length < minLen) {
            $$options.val([]);
            return;   
          }
          $$loading.toggle();
          getHints(this.value).then(function (hints) {
            $$.update(
              [$$options, hints],
              [$$loading, false]
            );
          });
          return false;
        },
        value: searchText,
        placeholder: defaultText,
        onkeydown(e) {
          if (e.which == UP || e.keyCode == UP) {
            if (selection > 0) {
              $$selection.val(selection - 1);
              return false;
            }
          }
          if (e.which == DOWN || e.keyCode == DOWN) {
            if (selection < (options || []).length - 1) {
              $$selection.val(selection + 1);
              return false;
            }
          }
          if (e.which == ENTER || e.keyCode == ENTER) {
            selection = options[selection];
            $$.update(
              [$$searchText, searchText],
              [$$loading, false],
              [$$options, []],
              [$$selection, -1]
            );

            onsearch(getText(selection) || searchText);
            return false;
          }
          if (e.which == ESC || e.keyCode == ESC) {
            this.blur();
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
            classNames += '.visible';
            children = h('.message', '没有搜索结果...');
          }
        } else {
          classNames += '.visible';
          children = options.map(function (o, idx) {
            return h('.item' + (idx == selection? '.selected': ''), {
              // don't use onclick, becauase onclick fired after onblur
              onmousedown() {
                $$.update(
                  [$$searchText, getText(o)],
                  [$$options, []],
                  [$$searchText, -1]
                );
                onsearch(getText(o), o);
                return false;
              }
            }, optionContent(o, searchText));
          });
        }
        return h(classNames, children);
      }(),
    ]);
  };
  return $$.connect([$$searchText, $$loading, $$options, $$selection, $$active], valueFunc);
};

export default $$searchBox;
