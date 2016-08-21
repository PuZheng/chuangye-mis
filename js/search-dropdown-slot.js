import $$ from './xx';
import { match, optionContent } from './dropdown-utils';
import virtualDom from 'virtual-dom';

var h = virtualDom.h;
const UP = 38;
const DOWN = 40;
const ENTER = 13;
const ESC = 27;

export var $$searchDropdown = function (
  {defaultText, $$value, $$options, onchange, optionConten=optionConten}
) {
  let $$searchText = $$('', 'search-text');
  let $$activated = $$(false, 'activated');
  let $$selection = $$(-1, 'selection');
  let valueFunc = function (activated, searchText, options, value, selection) {
    let classNames = ['dropdown', 'search'];
    if (activated) {
      classNames.push('activated');
    }
    classNames = classNames.map(c => '.' + c).join('');
    let selectedOption;
    if (value != 'undefined') {
      for (var option of options) {
        if (option.value == value) {
          selectedOption = option;
          break;
        }
      }
    }
    let optionElms = options.map(function (o, idx) {
        let classNames = ['item'];
        (o.value == value) && classNames.push('current-value');
        (idx == selection) && classNames.push('selected');
        let filtered = searchText && !match(o, searchText);
        filtered && classNames.push('filtered');
        classNames = classNames.map( c => '.' + c ).join('');
        return h(classNames, {
          dataFiltered: filtered,
          // note!!!, don't use onclick, since onclick event fired after input.search's onblur
          onmousedown: function () {
            onchange(o.value, o);
          },
        }, optionContent(o, searchText));
      });
    if (optionElms.length == 0 || optionElms.every( o => o.properties.dataFiltered )) {
      optionElms = [h('.message', '没有可选项')];
    }
    return h(classNames, {
      // a div with tabIndex could be focused/blured
    }, [
      h('i.icon.fa.fa-caret-down'),
      h('input.search', {
        tabIndex: 0,
        value: searchText,
        oninput: function () {
          $$searchText.val(this.value);
        },
        onfocus: function () {
          $$activated.val(true);
          return false;
        },
        onmousedown: function () {
          // click an activated dropdown will make it blur
          $$activated.toggle();
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
