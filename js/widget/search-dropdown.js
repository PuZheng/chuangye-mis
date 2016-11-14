import $$ from 'slot';
import * as dropdownUtils from '../dropdown-utils';
import virtualDom from 'virtual-dom';

var h = virtualDom.h;
const UP = 38;
const DOWN = 40;
const ENTER = 13;
const ESC = 27;

export var $$searchDropdown = function (
  {
    defaultText,
    $$value,
    $$options,
    onchange,
    optionGroup,
    optionContent=dropdownUtils.optionContent,
  }
) {
  let $$searchText = $$('', 'search-text');
  let $$activated = $$(false, 'activated');
  let $$selection = $$(-1, 'selection');
  let inputEl;
  let valueFunc = function ([activated, searchText, options, value, selection]) {
    options = options.map(function (o) {
      if (typeof o === 'string') {
        return {
          value: o,
          text: o,
        };
      }
      return o;
    });
    let classNames = ['dropdown', 'search'];
    if (activated) {
      classNames.push('activated');
    }
    if (optionGroup) {
      classNames.push('grouped');
    }
    classNames = classNames.map(c => '.' + c).join('');
    let selectedOption;
    // this is a little tricky, we assume 'void 0' as 'no value', so if an
    // option without value (namely, void 0), is considered to be a clear
    // action
    if (value !== void 0) {
      for (var option of options) {
        if (option.value == value) {
          selectedOption = option;
          break;
        }
      }
    }
    options = options.filter(function (o) {
      return dropdownUtils.match(o, searchText);
    });
    let optionElms;
    if (optionGroup) {
      let groups = {};
      for (let option of options) {
        let group = optionGroup(option);
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(option);
      }
      optionElms = [];
      let optionCounter = 0;
      for (let k in groups) {
        let subOptions = groups[k];
        optionElms.push(h('.group', [
          h('.group-name', k),
          h('.options', subOptions.map(function (o, idx) {
            let classNames = ['item'];
            (o.value == value) && classNames.push('current-value');
            (optionCounter + idx == selection) && classNames.push('selected');
            classNames = classNames.map( c => '.' + c ).join('');
            return h(classNames, {
              // note!!!, don't use onclick, since onclick event fired after input.search's onblur
              onmousedown: function () {
                onchange(o.value, o);
              },
            }, optionContent(o, searchText));
          })),
          h('.clearfix')
        ]));
        optionCounter += subOptions.length;
      }
    } else {
      optionElms = options.map(function (o, idx) {
        let classNames = ['item'];
        (o.value == value) && classNames.push('current-value');
        (idx == selection) && classNames.push('selected');
        classNames = classNames.map( c => '.' + c ).join('');
        return h(classNames, {
          // note!!!, don't use onclick, since onclick event fired after input.search's onblur
          onmousedown: function () {
            onchange(o.value, o);
          },
        }, optionContent(o, searchText));
      });
    }


    if (optionElms.length == 0) {
      optionElms = [h('.message', '没有可选项')];
    }
    return h(classNames, {
      // a div with tabIndex could be focused/blured
    }, [
      h('.icons', [
        selectedOption? h('i.icon.clear.fa.fa-remove', {
          onmousedown(e) {
            e.stopPropagation();
            onchange(null);
            return false;
          }
        }): '',
        h('i.icon.fa.fa-caret-down', {
          onclick() {
            inputEl.focus();
          }
        }),
      ]),
      h('input.search', {
        tabIndex: 0,
        hook: new class Hook {
          hook(el) {
            inputEl = el;
          }
        },
        value: searchText,
        oninput: function () {
          $$searchText.val(this.value);
        },
        onfocus: function () {
          $$activated.val(true);
          return false;
        },
        onmousedown: function (e) {
          // click an activated dropdown will make it blur
          if (!activated) {
            $$activated.toggle();
          } else {
            this.blur();
            e.preventDefault();
          }
        },
        onblur: function () {
          $$.update(
            [$$searchText, ''],
            [$$selection, -1],
            [$$activated, false]
          );
          return false;
        },
        onkeydown: function (e) {
          if (e.which === UP || e.keyCode === UP) {
            if (selection > 0) {
              $$selection.val(selection - 1);
            }
          }
          if (e.which === DOWN || e.keyCode === DOWN) {
            if (selection < options.length - 1) {
              $$selection.val(Number(selection) + 1);
              return false;
            }
          }
          if (e.which === ENTER || e.keyCode === ENTER) {
            selection = options[selection];
            $$selection.val(-1);
            this.blur();
            selection && onchange(selection.value, selection);
          }
          if (e.which === ESC || e.keyCode === ESC) {
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
      h('.menu', optionElms)
    ]);
  };
  return $$.connect([$$activated, $$searchText, $$options, $$value, $$selection],
                    valueFunc);
};

export default $$searchDropdown;
