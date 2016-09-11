import virtualDom from 'virtual-dom';
import makeTag from './make-tag';
import $$ from 'slot';
import pipeSlot from 'pipe-slot';
import CellMode from './cell-mode';

var VNode = virtualDom.VNode;
var VText = virtualDom.VText;


class Hook {
  constructor(cell) {
    this.cell = cell;
    this.ondblclick = function (cell) {
      return function () {
        cell.ondblclick();
      };
    }(cell);
    this.onclick = function (cell) {
      return function () {
        cell.onclick();
      };
    }(cell);
  }
  onclick(e) {
    this.cell.onclick(e);
  }
  hook(el) {
    if (~Array.from(el.classList).indexOf('A1')) {
    }
    this.cell.el = el;
    el.addEventListener('dblclick', this.ondblclick);
    el.addEventListener('click', this.onclick);
  }
  unhook(el) {
    el.removeEventListener('dblclick', this.ondblclick);
    el.removeEventListener('click', this.click);
    el = null;
  }
};

class EditorHook {
  constructor(cell, onChangeCb) {
    this.moveCaretAtEnd = function moveCaretAtEnd(e) {
      var temp_value = e.target.value;
      e.target.value = '';
      e.target.value = temp_value;
    };
    this.cell = cell;
    this.onChangeCb = onChangeCb;
    let editor = this;
    this.onkeydown = function onkeydown(e) {
      if (e.keyCode == 27 || e.keyCode == 13) {
        e.stopPropagation();
        e.currentTarget.blur();
        return false;
      }
    };
    this.onblur = function onblur() {
      editor.onChangeCb(this.value);
    };
  }
  hook(el) {
    this.cell.inputEl = el;
    el.value = (this.cell.def && this.cell.def.val) || '';
    el.onfocus = this.moveCaretAtEnd;
    el.addEventListener('keydown', this.onkeydown);
    el.addEventListener('blur', this.onblur);
  }
  unhook(el) {
    el.onfocus = null;
    el.removeEventListener('keydown', this.onkeydown);
    el.removeEventListener('blur', this.onblur);
    el = null;
  }

};

class Cell {
  constructor(sg, row, col) {
    this.sg = sg;
    this.row = row;
    this.col = col;
    this.hook = new Hook(this);
    this.editorHook = new EditorHook(this, function (cell) {
      return function (val) {
        let updates = [
          [cell.sg.$$focusedCell, Object.assign(cell.sg.$$focusedCell.val(), {
            mode: CellMode.SELECTED,
          })]
        ];
        let def = cell.$$def.val();
        if ((def && def.val) != val) {
          cell.sg.setCellDef(cell.tag, Object.assign(cell.def || {}, {
            val 
          }));
          cell.sg.dataSlotManager.reset();
          let $$envSlot = cell.sg.getCellSlot(cell.tag);
          $$envSlot && $$envSlot.update();
          cell.sg.cells.forEach(function (row) {
            row.forEach(function (cell) {
              cell.$$def.update();
            });
          });
        }
        $$.update(...updates);
        return false;
      };
    }(this));
    this.$$val = $$(null, `cell-${row}-${col}-val`);
    this.$$def = $$.connect(
      [this.sg.$$topmostRow, this.sg.$$leftmostCol, this.sg.$$activeSheetIdx], 
      function (cell) {
        return function ([topmostRow, leftmostCol]) {
          cell.tag = makeTag(cell.row + topmostRow, 
                            cell.col + leftmostCol);
          let def = cell.sg.getCellDef(cell.tag);
          cell.$$envSlot = cell.sg.getCellSlot(cell.tag);
          if (cell.$$envSlot) {
            cell.$$val.connect([cell.$$envSlot], ([it]) => it);
          } else {
            cell.$$val.connect([], () => (def && def.val) || '');
          }
          return def;
        };
      }(this),
      `cell-${row}-${col}-def`
    );
  }
  get $$view() {
    if (this._$$view) {
      return this._$$view;
    }
    let vf = function (cell) {
      return function ([focusedCell, def, val]) {
        let className = ['cell', cell.tag];
        if (def && def.readOnly) {
          className.push('readonly');
        }
        let mode = (focusedCell && focusedCell.tag === cell.tag)? focusedCell.mode: CellMode.DEFAULT;
        let selected = mode == CellMode.SELECTED;
        if (selected) {
          className.push('selected');
        }
        let editing = mode == CellMode.EDIT;
        if (editing) {
          className.push('editing');
        }
        let style = def && def.style;
        if (typeof style === 'object') {
          let s = '';
          for (let k in style) {
            let v = style[k];
            k = k.replace(/[A-Z]/g, function (s) { 
              return '-' + s.toLowerCase();
            }).replace(/^_/, '');
            s += `${k}: ${v};`;
          }
          style = s;
        }
        let properties = {
          attributes: {
            class: className.join(' '),
            style: style,
          },
          hook: cell.hook,
        };
        let ret = new VNode('div', properties, [
          cell.makeContentVnode(def, val, editing),
          cell.makeEditor(def, editing),
        ]);
        if (cell.inputEl) {
          cell.inputEl.value = cell.inputEl.getAttribute('value');
        }
        return ret;
      };
    }(this);
    return this._$$view = pipeSlot(null, 'cell-${this.tag}').connect(
      [this.sg.$$focusedCell, this.$$def, this.$$val], 
      vf);
  }
  makeEditor(def, editing) {
    // it could be more sophisticated
    let properties = {
      hook: this.editorHook,
      attributes: {
        class: 'editor',
        type: 'text',
        value: (def && def.val) || '',
        style: editing? '': 'display: none', 
      }
    };
    return new VNode('input', properties);
  }
  makeContentVnode(def, val, editing) {
    // it could be more sophisticated
    let properties = {
      attributes: {
        class: 'content',
        style: editing? 'display: none': '',
      }
    };
    return new VNode('div', properties, [new VText(String(val))]);
  }
  onclick() {
    let focusedCell = this.sg.$$focusedCell;
    if (focusedCell && focusedCell.tag == this.tag) {
      return;
    }
    this.sg.$$focusedCell.val({
      tag: this.tag,
      row: this.row + this.sg.$$topmostRow.val(),
      col: this.col + this.sg.$$leftmostCol.val(),
      mode: CellMode.SELECTED,
    });
  }
  ondblclick() {
    let def = this.$$def.val();
    if ((def && def.readOnly)) {
      return;
    }
    this.sg.$$focusedCell.val({
      tag: this.tag,
      row: this.row + this.sg.$$topmostRow.val(),
      col: this.col + this.sg.$$leftmostCol.val(),
      mode: CellMode.EDIT,
    });
  }
};

export default Cell;
