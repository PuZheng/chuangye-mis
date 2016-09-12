import $$ from '../slot/';
import { Lexer } from './script/lexer.js';
import { Interpreter } from './script/interpreter.js';
import { Parser } from './script/parser.js';

/**
 * make a slot for a cell which:
 * 1. either depends on other cells 
 * 2. or is depended by other cells. 
 * 3. is asked by client to have a slot
 *
 * for example, given 3 cells:
 * [
 *    ['1', '2'],
 *    ['=B1*2']
 * ]
 * cell 'B1' has a slot, since 'A2' depends on it, but 'A1' doesn't have a 
 * slot, since no cells depends on it, and it doesn't depend on any cells.
 * */
class DataSlotManager {
  /**
   * @constructor
   * @param {Analyzer} analyzer
   * */
  constructor(analyzer) {
    this._data = [];
    this.analyzer = analyzer;
    this.stickyTags = new Set();
    this._reservedTags = new Set();
    this.reset();
  }
  /**
   * reset all the slots for the cells, the old slots are reused if possible,
   * those not needed are deleted 
   * */
  reset() {
    for (var [idx, sheet] of this.analyzer.sheets.entries()) {
      // note, this._data[idx] may already created
      this._data[idx] = this._data[idx] || {};
      var slots = this._data[idx];
      for (let tag in sheet.cells) {
        let cell = sheet.cells[tag];
        if (!cell.primitive || this.stickyTags.has(tag)) {
          slots[tag] = this.makeSlot(cell, sheet.idx);
        }
      }
    }
    for (let slots of this._data) {
      for (let tag in slots) {
        if (!this._reservedTags.has(tag)) {
          delete slots[tag];
        }
      }
    }
    this._reservedTags.clear();
  }
  /**
   * Get all the slots
   * @return {array} - each element is an object with 3 fields:
   *  * sheetIdx
   *  * tag
   *  * slot
   * */
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
  /**
   * make a slot for cell, if the cell depends on other cells, we will assure 
   * each dependent cell does have a slot. 
   * @param cell - cell definition
   * @param currentSheetIdx - the sheet idx of the cell
   * */
  makeSlot(cell, currentSheetIdx) {
    this._reservedTags.add(cell.tag);
    let slot = this.get(currentSheetIdx, cell.tag);
    if (cell.primitive)  {
      if (!slot) {
        return $$(cell.val, `cell-${cell.tag}`);
      } else {
        return slot.connect([], () => cell.val);
      }
    } else {
      if (!slot) {
        slot = $$(null, `cell-${cell.tag}`);
      }
      return slot.connect(this.getDependentSlots(cell, currentSheetIdx), function (slots) {
        let env = {};
        for (var { val, tag, sheetName } of slots) {
          env[sheetName? sheetName + ':' + tag: tag] = val;
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
            sheetName,
          };
        }));
      }
      return dependentSlots;
  }
  get(sheetIdx, tag) {
    return (this._data[sheetIdx] || {})[tag];
  }
  /**
   * ask to create a slot for a given cell
   * */
  create(sheetIdx, tag) {
    this.stickyTags.add(tag);
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
