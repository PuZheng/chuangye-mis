import virtualDom from 'virtual-dom';
import makeTag from './make-tag';
import $$ from 'slot';
import CellMode from './cell-mode';
import { sprintf } from 'sprintf-js';

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
        cell.select();
      };
    }(cell);
  }
  hook(el) {
    this.cell.el = el;
    el.addEventListener('dblclick', this.ondblclick);
    el.addEventListener('click', this.onclick);
  }
  unhook(el) {
    el.removeEventListener('dblclick', this.ondblclick);
    el.removeEventListener('click', this.onclick);
    el = null;
  }
}

let stringifyStyle = function (style) {
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
  return style;
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
      editor.onChangeCb(cell, this.value);
    };
  }
  hook(el) {
    this.el = el;
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

}

/**
 * Cell actually represent a vnode slot, it may display as any cell (determined
 * by leftmost column and topmost row)
 * */
class Cell {
  /**
   * @constructor
   *
   * @param {SmartGrid} - sg
   * @param {row} - the row of the cell in vnode grid
   * @param {col} - the column of the cell in vnode grid
   * */
  constructor(sg, row, col) {
    this.sg = sg;
    this.row = row;
    this.col = col;
    this.hook = new Hook(this);
    this.editorHook = new EditorHook(this, function (cell, val) {
      let that = this;
      if ((cell.def && cell.def.val) != val) {
        let validate = (cell.def || {}).__validate;
        Promise.resolve(validate? validate.apply(cell, [val]): null)
        .then(function () {
          let def = Object.assign(cell.def || {}, { val });
          cell.sg.setCellDef(cell.tag, def);
          // why reset all the slots? since modify a value of a cell will affect
          // many other cells, and we can't know the affection unless we reset
          // all the slots, for example, in a grid
          // [
          //  ['1', '=A1+2'],
          //  ['2'],
          // ]
          // if we change definition of 'B1' to '0', then the slot of 'A1'
          // will be revoked, however in this grid
          // [
          //  ['1', '=A1+2'],
          //  ['=A1*2']
          // ]
          // if we change definition of 'B1' to '0', slot of 'A1' will not be
          // revoked, since 'B1' depends on 'A1'
          //
          // reset will reuse existing slots if possible, so we don't need to
          // recreate the whole grid (which is a very expensive operation)
          cell.sg.dataSlotManager.reset();
          cell.def = cell.sg.getCellDef(cell.tag);
          cell.$$envSlot = cell.sg.getCellSlot(cell.tag);
          let slots = [cell.sg.$$focusedCell];
          if (cell.$$envSlot) {
            slots.push(cell.$$envSlot);
          }
          cell.$$view.connect(slots, cell._vf).refresh(null, true);
          cell.def.__onchange && cell.def.__onchange.apply(cell);
        }, function () {
          that.el.value = '';
        });
      }
      cell.sg.$$focusedCell.patch({
        mode: CellMode.SELECTED
      });
      return false;
    });
    this.tag = makeTag(this.row, this.col);
    this.mode = CellMode.DEFAULT;
    this._vf = function (cell) {
      return function _vf([focusedCell, val], initiators) {
        // if:
        // 1. only the focusedCell change
        // 2. I am not the unfocused or focused one
        // this wave of change has nothing todo with me
        let newMode = (focusedCell && focusedCell.tag === cell.tag)?
          focusedCell.mode: CellMode.DEFAULT;
        if (this.value && initiators && initiators.length == 1 &&
            initiators[0].id == cell.sg.$$focusedCell.id) {
          if (cell.mode == newMode) {
            return this.value;
          }
        }
        cell.mode = newMode;
        if (val === void 0) {
          val = cell.def && cell.def.val || '';
        }
        return cell.def && cell.def.__makeVNode?
        cell.def.__makeVNode(cell, val): cell.makeVNode(val);
      };
    }(this);
    this.$$view = $$(null, `cell-${row}-${col}`);
    this.resetView(0, 0);
  }
  makeVNode(val) {
    let className = ['cell', this.tag];
    if (this.def && this.def.readonly) {
      className.push('readonly');
    }
    if (this.def && this.def.class) {
      className = className.concat(this.def.class);
    }
    let selected = this.mode == CellMode.SELECTED;
    if (selected) {
      className.push('selected');
    }
    let editing = this.mode == CellMode.EDIT;
    if (editing) {
      className.push('editing');
    }
    let properties = function (cell) {
      let title = (cell.def && cell.def.title);
      if (!title) {
        let d = {};
        for (let k in cell.def) {
          if (!k.startsWith('__')) {
            d[k]  = cell.def[k];
          }
        }
        title = JSON.stringify(d, null, 2);
      }
      return {
        attributes: {
          class: className.join(' '),
          style: stringifyStyle(cell.def? cell.def.style: {}),
          title,
        },
        hook: cell.hook,
      };
    }(this);
    let ret = new VNode('div', properties, [
      this.makeContentVnode(this.def, val, editing),
      this.makeEditorVnode(this.def, editing),
    ]);
    // reset the input element's value, since VNode won't reset value
    // for you
    return ret;
  }
  resetView(topmostRow, leftmostCol) {
    this.tag = makeTag(this.row + topmostRow,
                       this.col + leftmostCol);
    this.def = this.sg.getCellDef(this.tag);
    this.$$envSlot = this.sg.getCellSlot(this.tag);
    let slots = [this.sg.$$focusedCell];
    this.$$envSlot && slots.push(this.$$envSlot);
    this.$$view.connect(slots, this._vf);
  }
  makeEditorVnode(def, editing) {
    // it could be more sophisticated
    let properties = {
      hook: this.editorHook,
      value: (def && def.val) || '',
      attributes: {
        class: 'editor',
        type: 'text',
        style: editing? '': 'display: none',
      }
    };
    return new VNode('input', properties);
  }
  makeContentVnode(def, val, editing) {
    // it could be more sophisticated
    val = String(val || '');
    if (val && def && def.format) {
      val = sprintf(def.format, val);
    }
    let colWidth = this.sg.resetColWidth(this.col + this.sg.$$leftmostCol.val(),
                                        val.length);
    let style = {
      width: colWidth + 'rem',
    };
    if (editing) {
      style.display = 'none';
    }
    let properties = {
      attributes: {
        class: 'content',
        style: stringifyStyle(style),
      }
    };
    if (val == '') {
      // 全角空格
      val = '\u3000';
    }
    return new VNode('div', properties, [new VText(val)]);
  }
  select() {
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
    let def = this.def;
    if ((def && def.readonly)) {
      return;
    }
    this.sg.$$focusedCell.val({
      tag: this.tag,
      row: this.row + this.sg.$$topmostRow.val(),
      col: this.col + this.sg.$$leftmostCol.val(),
      mode: CellMode.EDIT,
    });
  }
}

export default Cell;
