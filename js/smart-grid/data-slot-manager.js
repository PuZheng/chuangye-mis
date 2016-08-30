import $$ from '../slot/';
import { Lexer } from './script/lexer.js';
import { Interpreter } from './script/interpreter.js';
import { Parser } from './script/parser.js';

class DataSlotManager {
  constructor(parser) {
    this._data = {};
    for (let sheet of parser.sheets) {
      this._data[sheet.name] = {};
      var slots = this._data[sheet.name];
      for (let cell of sheet.cells) {
        slots[cell.tag] = this.makeSlot(cell);
      }
    }
  }
  makeSlot(cell) {
    if (cell.primitive)  {
      return $$(cell.val, `cell-${cell.tag}`);
    } else {
      let dependentSlots = [];
      let variableNames = [];
      for (let {tabName, tag} of cell.dependencies) {
        if (!this._data[tabName][tag]) {
          this._data[tabName][tag] = this.makeSlot(tabName, tag);
        }
        dependentSlots.push(this._data[tabName][tag]);
        variableNames.push(tabName? tabName + ':' + tag: tag);
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
  get(tabName, tag) {
    return this._data[tabName][tag];
  }
};

export default DataSlotManager;
