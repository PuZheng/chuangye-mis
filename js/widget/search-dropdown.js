import $$ from 'slot';
import * as dropdownUtils from '../dropdown-utils';
import virtualDom from 'virtual-dom';

var { h } = virtualDom;
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
    maxOptions=8,
    optionContent=dropdownUtils.optionContent,
  }
) {
  let myHook = new class MyHook {
    hook(el) {
      setTimeout(function () {
        $$optionHeight.val(el.querySelector('.item').offsetHeight);
        $$view.connect(
          [
            $$activated, $$searchText, $$options, $$value, $$selection, $$top,
            $$grabbing, $$optionHeight,
          ],
          valueFunc
        ).refresh(null, true);
      }, 0);
    }
  };
  let $$searchText = $$('', 'search-text');
  let $$activated = $$(false, 'activated');
  let $$selection = $$(-1, 'selection');
  let inputEl;
  let $$top = $$(0, 'top');
  let $$grabbing = $$(false, 'grabbing');
  let $$optionHeight = $$(0, 'optionHeight');
  let valueFunc = function (
    [activated, searchText, options, value, selection, top, grabbing,
      optionHeight]
  ) {
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
    let menuHeight = Math.min(options.length, maxOptions) * optionHeight;
    if (menuHeight == 0) {
      menuHeight = optionHeight;
    }
    let menuContentHeight = options.length * optionHeight;
    let topRow = Math.round(top * menuContentHeight / optionHeight);

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
              // note!!!, don't use onclick, since onclick event fired after
              // input.search's onblur
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
      optionElms = options.slice(topRow, topRow + maxOptions)
      .map(function (o, idx) {
        let classNames = ['item'];
        (o.value == value) && classNames.push('current-value');
        (topRow + idx == selection) && classNames.push('selected');
        classNames = classNames.map( c => '.' + c ).join('');
        return h(classNames, {
          // note!!!, don't use onclick, since onclick event fired after
          // input.search's onblur
          onmousedown: function () {
            onchange(o.value, o);
          },
        }, optionContent(o, searchText));
      });
    }

    if (optionElms.length == 0) {
      optionElms = [h('.message', '没有可选项')];
    }
    return h(classNames, [
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
            if ($$selection.val() >= 0 && $$selection.val() < topRow) {
              $$top.dec(1 / options.length);
            }
            return false;
          }
          if (e.which === DOWN || e.keyCode === DOWN) {
            if (selection < options.length - 1) {
              $$selection.val(Number(selection) + 1);
            }
            if ($$selection.val() >= topRow + maxOptions) {
              $$top.inc(1 / options.length);
            }
            return false;
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
      h('.menu', {
        onwheel(e) {
          if (maxOptions >= options.length) {
            return false;
          }
          let top = (
            ($$top.val() * menuContentHeight + e.deltaY / 2) / menuContentHeight
          );
          if (top < 0) {
            top = 0;
          }
          if (top * menuContentHeight + menuHeight >= menuContentHeight) {
            top = (menuContentHeight - menuHeight) / menuContentHeight;
          }
          $$top.val(top);
          return false;
        },
        style: {
          height: menuHeight,
        }
      }, [
        h('.items', optionElms),
        maxOptions < options.length? h(
          '.scrollbar.vertical' + (grabbing? '.grabbing': ''),
          h('.bar', {
            onmousedown(e) {
              $$grabbing.val(true);
              let lastY = e.clientY;
              let onmouseup = function () {
                $$grabbing.val(false);
                document.removeEventListener('mouseup', onmouseup);
                document.removeEventListener('mousemove', onmousemove);
              };
              let onmousemove = function (e) {
                top = (top * menuHeight + e.clientY - lastY) / menuHeight;
                lastY = e.clientY;
                if (top < 0) {
                  top = 0;
                }
                if (top * menuContentHeight + menuHeight >= menuContentHeight) {
                  top = (menuContentHeight - menuHeight) / menuContentHeight;
                }
                $$top.val(top);
              };
              document.addEventListener('mouseup', onmouseup);
              document.addEventListener('mousemove', onmousemove);
            },
            style: (function() {
              // 为了防止滚动条太短， 我们保证其长度至少是.5 / maxOptions
              let minHeight = .5 / maxOptions;
              let height = maxOptions / options.length;
              // 如果滚动条太短，将滚动条的实际映射区域"居中"
              if (height < minHeight) {
                top = top - (minHeight - height) / 2;
                height = minHeight;
              }
              return {
                top: top * 100 + '%',
                height: height * 100 + '%'
              };
            }())
          })
        ): void 0,
      ])
    ]);
  };
  let $$view = $$.connect([], function () {
    return h('.search.dropdown.activated', {
      myHook
    }, [
      h('.icons', h('i.icon.fa.fa-caret-down')),
      h('input.search'),
      h('.text.default', defaultText),
      h('.menu', [
        h('.items', h('.item', 'option1')),
      ]),
    ]);
  });
  return $$view;
};

export default $$searchDropdown;
