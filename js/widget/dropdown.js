import $$ from 'slot';
import virtualDom from 'virtual-dom';

const UP = 38;
const DOWN = 40;
const ENTER = 13;
const ESC = 27;

var h = virtualDom.h;

export var $$dropdown = function (
  {
    $$options, $$value, defaultText, onchange,
    $$disabled=$$(false, 'disabled'),
    optionContent=function (o) {
      if (typeof o === 'object') {
        return o.text;
      }
      return o;
    },
    optionValue= function (o) {
      if (typeof o === 'object') {
        return o.value;
      }
      return o;
    }
  }
) {
  let $$activated = $$(false, 'activated');
  let $$selection = $$(-1, 'selection');
  let vf = function ([activated, options, value, selection, disabled]) {
    let classNames = ['dropdown'];
    if (activated) {
      classNames.push('activated');
    }
    disabled && classNames.push('disabled');
    classNames = classNames.map( c => '.' + c ).join('');
    let selectedOption;
    // this is a little tricky, we assume 'void 0' as 'no value', so if an
    // option without value (namely, void 0), is considered to be a clear
    // action
    if (value !== void 0) {
      for (var option of options) {
        if (optionValue(option) == value) {
          selectedOption = option;
          break;
        }
      }
    }
    let optionClassNames = function (o, idx) {
      let cs = '.item';
      if (optionValue(o) == value) {
        cs += '.current-value';
      }
      if (idx == selection) {
        cs += '.selected';
      }
      return cs;
    };
    let optionElms = options.map(function (o, idx) {
      return h(optionClassNames(o, idx), {
        onmousedown: function (e) {
          $$.update(
            [$$activated, !activated],
            [$$selection, -1]
          );
          onchange(optionValue(o), o);
          // we don't want the parent to handle onmousedown
          e.stopPropagation();
        },
      }, optionContent(o));
    });
    if (optionElms.length == 0) {
      optionElms = [h('.message', '没有可选项')];
    }
    return h(classNames, {
      // a div with tabIndex could be focused/blured
      tabIndex: 0,
      onfocus: !disabled && function () {
        $$activated.val(true);
      },
      onmousedown: !disabled && function () {
        // click an activated dropdown will make it blur
        $$activated.toggle();
      },
      onblur: function () {
        $$.update(
          [$$activated, false],
          [$$selection, -1]
        );
      },
      onkeydown: function (e) {
        if (e.which === UP || e.keyCode === UP) {
          if (selection > 0) {
            $$selection.val(selection - 1);
            return false;
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
          this.blur();
          selection && onchange(optionValue(selection), selection);
          return false;
        }
        if (e.which === ESC || e.keyCode === ESC) {
          this.blur();
          return false;
        }
      },
    }, [
      h('.icons', [
        selectedOption? h('i.icon.clear.fa.fa-remove', {
          onmousedown(e) {
            e.stopPropagation();
            onchange(null);
            return false;
          }
        }): '',
        h('i.icon.fa.fa-caret-down'),
      ]),
      h('.text' + (selectedOption? '': '.default'), selectedOption? optionContent(selectedOption): defaultText),
      h('.menu', optionElms)
    ]);
  };
  return $$.connect([$$activated, $$options, $$value, $$selection, $$disabled], vf);
};

export default $$dropdown;
