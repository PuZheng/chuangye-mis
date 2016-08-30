import $$ from '../slot/';
import { Lexer } from './script/lexer.js';
import { Interpreter } from './script/interpreter.js';
import { Parser } from './script/parser.js';
import Analyzer from './analyzer';

class DataSlotManager {
  constructor(def) {
    this._data = {};
    this.analyzer = new Analyzer(def);
    for (let sheet of this.analyzer.sheets) {
      this._data[sheet.name] = this._data[sheet.name] || {};
      var slots = this._data[sheet.name];
      for (let tag in sheet.cells) {
        slots[tag] = this.makeSlot(sheet.cells[tag], sheet.name);
      }
    }
  }
  makeSlot(cell, defaultSheetName) {
    if (cell.primitive)  {
      return $$(cell.val, `cell-${cell.tag}`);
    } else {
      let dependentSlots = [];
      let variableNames = [];
      for (let {sheetName, tag} of cell.dependencies) {
        variableNames.push(sheetName? sheetName + ':' + tag: tag);
        sheetName = sheetName || defaultSheetName;
        if (!this._data[sheetName]) {
          this._data[sheetName] = {};
        }
        if (!this._data[sheetName][tag]) {
          this._data[sheetName][tag] = this.makeSlot(this.analyzer.getCellDef(sheetName, tag) || {
            primitive: true,
            val: '',
            tag: tag,
          }, sheetName);
        }
        dependentSlots.push(this._data[sheetName][tag]);
      }
      return $$.connect(dependentSlots, function (...slots) {
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
  get(sheetName, tag) {
    return (this._data[sheetName] || {})[tag];
  }
};

export default DataSlotManager;
