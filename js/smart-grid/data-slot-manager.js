import $$ from '../slot/';
import { Lexer } from './script/lexer.js';
import { Interpreter } from './script/interpreter.js';
import { Parser } from './script/parser.js';

class DataSlotManager {
  constructor(analyzer) {
    this._data = [];
    this.analyzer = analyzer;
  }
  reset() {
    for (var [idx, sheet] of this.analyzer.sheets.entries()) {
      // note, this._data[idx] may already created
      this._data[idx] = this._data[idx] || {};
      var slots = this._data[idx];
      for (let tag in sheet.cells) {
        let cell = sheet.cells[tag];
        if (!cell.primitive) {
          slots[tag] = this.makeSlot(cell, sheet.idx);
        }
      }
    }
  }
  get slots() {
    let dsm = this;
    return function *() {
      for (let sheetIdx = 0; sheetIdx < dsm._data.length; ++sheetIdx) {
        let sheet = dsm._data[sheetIdx];
        for (let tag in sheet) {
          yield {
            sheetIdx,
            tag,
            slot: sheet[tag],
          };
        }
      }
    }();
  }
  makeSlot(cell, currentSheetIdx) {
    if (cell.primitive)  {
      return $$(cell.val, `cell-${cell.tag}`);
    } else {
      let slot = this.get(currentSheetIdx, cell.tag);
      if (!slot) {
        slot = $$(null, `cell-${cell.tag}`);
      }
      return slot.connect(this.getDependentSlots(cell, currentSheetIdx), function (slots) {
        let env = {};
        for (var { val, tag } of slots) {
          env[tag] = val;
        }
        let lexer = new Lexer(cell.script);
        let parser = new Parser(lexer);
        return new Interpreter(parser.expr, env).eval();
      });
    }
  }
  getDependentSlots(cellDef, currentSheetIdx) {
      let dependentSlots = [];
      for (let {sheetName, tag} of cellDef.dependencies) {
        let sheetIdx;
        if (sheetName) {
          sheetIdx = Number(sheetName.replace(/SHEET/i, '')) - 1;
        } else {
          sheetIdx = currentSheetIdx;
        }
        if (!this._data[sheetIdx]) {
          this._data[sheetIdx] = {};
        }
        if (!this._data[sheetIdx][tag]) {
          this._data[sheetIdx][tag] = this.makeSlot(this.analyzer.getCellDef(sheetIdx, tag) || {
            primitive: true,
            val: '',
            tag: tag,
          }, sheetIdx);
        }
        dependentSlots.push(this._data[sheetIdx][tag].map(function (val) {
          return {
            val,
            tag,
          };
        }));
      }
      return dependentSlots;
  }
  get(sheetIdx, tag) {
    return (this._data[sheetIdx] || {})[tag];
  }
  create(sheetIdx, tag) {
    let slot = this.get(sheetIdx, tag);
    if (!slot) {
      if (!this._data[sheetIdx])  {
        this._data[sheetIdx] = {};
      }
      let cellDef = this.analyzer.getCellDef(sheetIdx, tag);
      slot = this._data[sheetIdx][tag] = this.makeSlot(cellDef, sheetIdx);
    }
    return slot; 
  }
};

export default DataSlotManager;
