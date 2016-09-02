import $$ from 'slot';
import { Lexer } from './script/lexer.js';
import { Interpreter } from './script/interpreter.js';
import { Parser } from './script/parser.js';

class DataSlotManager {
  constructor(analyzer) {
    this._data = [];
    this.analyzer = analyzer;
    for (var [idx, sheet] of this.analyzer.sheets.entries()) {
      // note, this._data[idx] may already created
      this._data[idx] = this._data[idx] || {};
      var slots = this._data[idx];
      for (let tag in sheet.cells) {
        let cell = sheet.cells[tag];
        if (!cell.primitive) {
          slots[tag] = this.makeSlot(cell, sheet);
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
  makeSlot(cell, currentSheet) {
    if (cell.primitive)  {
      return $$(cell.val, `cell-${cell.tag}`);
    } else {
      let dependentSlots = [];
      let variableNames = [];
      for (let {sheetName, tag} of cell.dependencies) {
        variableNames.push(sheetName? sheetName + ':' + tag: tag);
        sheetName = sheetName;
        let sheetIdx;
        if (sheetName) {
          sheetIdx = Number(sheetName.replace(/SHEET/i, '')) - 1;
        } else {
          sheetIdx = currentSheet.idx;
        }
        if (!this._data[sheetIdx]) {
          this._data[sheetIdx] = {};
        }
        if (!this._data[sheetIdx][tag]) {
          this._data[sheetIdx][tag] = this.makeSlot(this.analyzer.getCellDef(sheetIdx, tag) || {
            primitive: true,
            val: '',
            tag: tag,
          }, this.analyzer.getSheet(sheetIdx));
        }
        dependentSlots.push(this._data[sheetIdx][tag]);
      }
      return $$(null, 'cell-${cell.tag}').connect(dependentSlots, function (slots) {
        let env = {};
        for (var i = 0; i < variableNames.length; ++i) {
          env[variableNames[i]] = slots[i];
        }
        let lexer = new Lexer(cell.script);
        let parser = new Parser(lexer);
        return new Interpreter(parser.expr, env).eval();
      });
    }
  }
  get(sheetIdx, tag) {
    return (this._data[sheetIdx] || {})[tag];
  }
};

export default DataSlotManager;
