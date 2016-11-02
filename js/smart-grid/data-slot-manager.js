import $$ from '../slot/';
import { Lexer, Token } from './engine/lexer.js';
import { Interpreter } from './engine/interpreter.js';
import { Parser } from './engine/parser.js';

/**
 * make a slot for a cell which:
 * 1. either depends on other cells
 * 2. or is depended by other cells.
 * 3. is asked by client to have a slot
 *
 * for example, given 3 cells:
 * [
 *    ['1', '2', { label: 'foo' }],
 *    ['=B1*2+${foo}']
 * ]
 * cell 'B1', 'C1' has a slot, since 'A2' depends on it, but 'A1' doesn't have a
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
    this._reserved = new Set();
    this.reset();
  }
  /**
   * reset all the slots for the cells, the old slots are reused if possible,
   * those not needed are deleted
   * */
  reset() {
    // create slots for the cells
    for (var [idx, sheet] of this.analyzer.sheets.entries()) {
      // note, this._data[idx] may already created
      this._data[idx] = this._data[idx] || {};
      var slots = this._data[idx];
      for (let tag in sheet.cells) {
        let cell = sheet.cells[tag];
        if (!cell.primitive || this.stickyTags.has(tag)) {
          this._reserved.add(idx + '-' + tag);
          slots[tag] = this.makeSlot(cell, sheet.idx, tag);
        }
      }
    }
    // purge unused slots
    for (let sheetIdx = 0; sheetIdx < this._data.length; ++sheetIdx) {
      let slots = this._data[sheetIdx];
      for (let tag in slots) {
        if (!this._reserved.has(sheetIdx + '-' + tag)) {
          delete slots[tag];
        }
      }
    }
    this._reserved.clear();
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
   * @param currentSheetIdx - the sheet idx of the cell, as the CONTEXT
   * */
  makeSlot(cell, currentSheetIdx, tag) {
    let slot = this.get(currentSheetIdx, tag);
    if (cell.primitive)  {
      if (!slot) {
        return $$(cell.val, `cell-${tag}`);
      } else {
        return slot.connect([], () => cell.val);
      }
    } else {
      if (!slot) {
        slot = $$(null, `cell-${tag}`);
      }
      let dependencies = this.getDependencies(cell, currentSheetIdx);
      return slot.connect(
        dependencies.map(dep => dep.slot),
        function (values) {
          let env = {};
          let refMaps = {};
          for (let i = 0; i < values.length; ++i) {
            let dep = dependencies[i];
            let val = values[i];
            let { label, tag, sheet } = dep;
            if (tag) {
              if (!env[sheet]) {
                env[sheet] = {};
              }
              env[sheet][tag] = val;
            }
            if (label) {
              if (!refMaps[sheet]) {
                refMaps[sheet] = {};
              }
              refMaps[sheet][label] = val;
            }
          }
          let lexer = new Lexer(cell.script);
          let parser = new Parser(lexer);
          return new Interpreter(parser.expr, env, refMaps).eval();
        }
      );
    }
  }
  getDependencies(cellDef, currentSheetIdx) {
    let dependentSlots = [];
    for (let token of cellDef.dependencies || []) {
      if (token.type != Token.REF && token.type != Token.VARIABLE) {
        throw new Error('dependent token type must be reference or variable');
      }
      let { sheet, name } = token.value;
      let sheetIdx;
      if (sheet) {
        sheetIdx = Number(sheet.replace(/SHEET/i, '')) - 1;
      } else {
        sheetIdx = currentSheetIdx;
      }
      if (!this._data[sheetIdx]) {
        this._data[sheetIdx] = {};
      }
      let tag;
      let label;
      if (token.type == Token.REF) {
        label = name;
        tag = this.analyzer.getTagByLabel(sheetIdx, name);
      } else if (token.type == Token.VARIABLE) {
        tag = name;
      }
      // I meet this cell
      this._reserved.add(sheetIdx + '-' + tag);
      this._data[sheetIdx][tag] = this.makeSlot(this.analyzer.getCellDef(sheetIdx, tag) || {
        primitive: true,
        val: '',
      }, sheetIdx, tag);
      dependentSlots.push({
        slot: this._data[sheetIdx][tag],
        sheet,
        tag,
        label,
      });
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
      let cellDef = this.analyzer.getCellDef(sheetIdx, tag) || {
        tag,
        primitive: true,
      };
      slot = this._data[sheetIdx][tag] = this.makeSlot(cellDef, sheetIdx);
    }
    return slot;
  }
}

export default DataSlotManager;
