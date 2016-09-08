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
  }
  hook(el) {
    let cell = this.cell;
    el.addEventListener('dblclick', function (e) {
      cell.ondblclick(e);
    });
    el.addEventListener('click', function (e) {
      cell.onclick(e);
    });
    cell.el = el;
  }
  unhook(el) {
    el.removeEventListener('dblclick', this.cell.ondblclick);
    el.removeEventListener('click', this.cell.click);
  }
};

class EditorHook {
  constructor(onChangeCb) {
    this.moveCaretAtEnd = function moveCaretAtEnd(e) {
      var temp_value = e.target.value;
      e.target.value = '';
      e.target.value = temp_value;
    };
    this.onChangeCb = onChangeCb;
    let editor = this;
    this.onkeydown = function onkeydown(e) {
      if (e.keyCode == 27 || e.keyCode == 13) {
        e.stopPropagation();
        editor.onChangeCb(this.value);
        return true;
      }
    };
    this.onblur = function onblur() {
      editor.onChangeCb(this.value);
    };
  }
  hook(el) {
    el.onfocus = this.moveCaretAtEnd;
    el.addEventListener('keydown', this.onkeydown);
    el.addEventListener('blur', this.onblur);
  }
  unhook(el) {
    el.onfocus = null;
    el.removeEventListener('keydown', this.onkeydown);
    el.removeEventListener('blur', this.onblur);
  }

};

class Cell {
  constructor(sg, sheetIdx, row, col) {
    this.sg = sg;
    this.sheetIdx = sheetIdx;
    this.row = row;
    this.col = col;
    this.hook = new Hook(this);
    this.editorHook = new EditorHook(function (cell) {
      return function (val) {
        let updates = [
          [cell.sg.$$focusedCell, Object.assign(cell.sg.$$focusedCell.val(), {
            mode: CellMode.SELECTED,
          })]
        ];
        cell.def = cell.sg.setCellDef(sheetIdx, cell.tag, Object.assign(cell.def, {
          val 
        }));
        cell.dataSlotManager.reset();
        $$.update(...updates);
        return false;
      };
    }(this));
  }
  get $$view() {
    if (this._$$view) {
      return this._$$view;
    }
    let cell = this;
    let vf = function (
      [focusedCell, leftmostCol, topmostRow, val], initiators
    ) {
      if (initiators && initiators.length) {
        cell.tag = makeTag(cell.row + topmostRow, cell.col + leftmostCol);
        cell.def = cell.sg.getCellDef(cell.sheetIdx, cell.tag);
        let leftChanged = ~initiators.indexOf(cell.sg.$$leftmostCol);
        let topChanged = ~initiators.indexOf(cell.sg.$$topmostRow);
        if (leftChanged || topChanged) {
          cell.$$envSlot = cell.sg.getCellSlot(cell.sheetIdx, cell.tag);
          if (cell.$$envSlot) {
            cell.$$val.connect([cell.$$envSlot], ([it]) => it);
          } else {
            cell.$$val.connect([], () => cell.def? cell.def.val: '');
          }
          val = cell.$$val.val();
        }
      }
      let className = ['cell', cell.tag];
      if (cell.def && cell.def.readOnly) {
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
      let properties = {
        attributes: {
          class: className.join(' '),
          style: cell.def && cell.def.style,
        },
        hook: cell.hook,
      };
      return new VNode('div', properties, [
        cell.makeContentVnode(cell.def, val, editing),
        cell.makeEditor(cell.def, val, editing),
      ]);
    };
    cell.tag = makeTag(this.row, this.col);
    this.$$envSlot = this.sg.getCellSlot(this.sheetIdx, this.tag);
    if (this.$$envSlot) {
      this.$$val = $$.connect([this.$$envSlot], function ([it]) {
        return it;
      }, 'cell-val-${cell.tag}');
    } else {
      this.def = this.sg.getCellDef(this.sheetIdx, this.tag);
      this.$$val = $$(cell.def? cell.def.val: '', 'cell-val-${cell.tag}');
    }
    return this._$$view = pipeSlot(null, 'cell-${cell.tag}').connect(
      [this.sg.$$focusedCell, this.sg.$$leftmostCol, this.sg.$$topmostRow, this.$$val], 
      vf);
  }
  makeEditor(def, val, editing) {
    // it could be more sophisticated
    let properties = {
      hook: this.editorHook,
      attributes: {
        class: 'editor',
        type: 'text',
        value: val,
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
    let focusedCell = this.sg.$$focusedCell;
    if ((this.def && this.def.readOnly) || 
        (focusedCell && focusedCell.tag == this.tag && focusedCell.mode === CellMode.EDIT)) {
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
