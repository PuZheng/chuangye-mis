import virtualDom from 'virtual-dom';
import makeTag from './make-tag';
import $$ from 'slot';
import pipeSlot from 'pipe-slot';

var VNode = virtualDom.VNode;
var VText = virtualDom.VText;


export const CellMode = {
  EDIT: 'EDIT',
  SELECTED: 'SELECTED',
  DEFAULT: 'DEFAULT',
};

class Hook {
  constructor(cell) {
    this.cell = cell;
  }
  hook(el) {
    el.addEventListener('dblclick', this.cell.ondblclick);
    el.addEventListener('click', this.cell.click);
  }
  unhook(el) {
    el.removeEventListener('dblclick', this.cell.ondblclick);
    el.removeEventListener('click', this.cell.click);
  }
};

class EditHook {
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
  constructor(sg, row, col) {
    this.sg = sg;
    this.row = row;
    this.col = col;
    this.tag = makeTag(row, col);
    this.$$mode = $$(CellMode.DEFAULT, 'cell-mode');
    this.hook = new Hook(this);
    let cell = this;
    this.editorHook = new EditHook(function (val) {
      $$.update(
        [cell.$$envSlot, val],
        [cell.$$mode, CellMode.SELECTED]
      );
      return false;
    });
  }
  get $$view() {
    let cell = this;
    let vf = function ([leftmostCol, topmostRow, val, mode], initiators) {
      let tag = makeTag(cell.row + topmostRow, cell.col + leftmostCol);
      cell.def = cell.sg.getCellDef(tag);
      if (initiators) {
        let leftChanged = ~initiators.indexOf(cell.sg.$$leftmostCol);
        let topChanged = ~initiators.indexOf(cell.sg.$$topmostRow);
        if (leftChanged || topChanged) {
          cell.$$envSlot = cell.sg.getCellSlot(tag);
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
    let tag = makeTag(this.row, this.col);
    this.$$envSlot = this.sg.getCellSlot(tag);
    if (this.$$envSlot) {
      this.$$val = $$.connect([this.$$envSlot], function ([it]) {
        return it;
      }, 'cell-val-${tag}');
    } else {
      cell.def = this.sg.getCellDef(tag);
      this.$$val = $$(cell.def? cell.def.val: '', 'cell-val-${tag}');
    }
    return pipeSlot(null, 'cell-{tag}').connect(
      [this.sg.$$leftmostCol, this.sg.$$topmostRow, this.$$val, this.$$mode], 
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
  get onclick() {
    let cell = this;
    if (cell.$$mode.val() === CellMode.DEFAULT) {
      return function onclick() {
        let args = [
          [cell.$$mode, CellMode.SELECTED],
        ];
        let focusedCell = cell.sg.$$focusedCell.val();
        if (focusedCell && (focusedCell.tag != cell.tag)) {
          args.push([focusedCell.$$mode, CellMode.DEFAULT]);
        }
        args.push([cell.sg.$$focusedCell, cell]);
        $$.update(...args);
      };
    }
  }
  get ondblclick() {
    let cell = this;
    if (!(cell.def && cell.def.readOnly) && cell.$$mode.val() != CellMode.EDIT) {
      return function () {
        let args = [
          [cell.$$mode, CellMode.EDIT]
        ];
        let focusedCell = cell.sg.$$focusedCell.val();
        if (focusedCell && (focusedCell.tag != cell.tag)) {
          args.push([focusedCell.$$mode, CellMode.DEFAULT]);
        };
        args.push([cell.sg.$$focusedCell, cell]);
        $$.update(...args);
        this.querySelector('input').focus();
      };
    }
  }
};

export default Cell;
