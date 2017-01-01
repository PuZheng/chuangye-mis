import makeTag from './make-tag';
import { Lexer, Token, unlex } from './engine/lexer.js';

/**
 * get next cell definition from raw definitions.
 *
 * @param {Array} grid - raw cell definition
 * @param {Number} i - row of start position
 * @param {Number} j - column of start position
 *
 * @return {Array} - next cell definition and its position, eg.
 *  [nextCellDef, nextRow, nextCol], or [void(0] if there's no next cell
 *  definition
 * */
var getNextCellDef = function getNextCellDef(grid, i, j) {
  let cellDef;
  while (i < grid.length) {
    let row = grid[i];
    if (!Array.isArray(row)) {
      row = row.cells;
    }
    if (!row) {
      throw 'if row is an object, then it must have a field named "cells"';
    }
    while (j < row.length &&
           (row[j] === void 0 || row[j] == null || row[j] == '')) {
      ++j;
    }
    if (row[j] === void 0) {
      j = 0;
      ++i;
      continue;
    }
    cellDef = row[j];
    break;
  }
  if (cellDef !== void 0) {
    return [cellDef, i, j];
  }
  return [];
};


/*
 * Analyzer of smart grid raw definitions.
 * */
class Analyzer {
  /**
   * @constructor
   *
   * @param {object} def - the raw definition of smart grid. it must has a field
   * named sheets which is an array of sheet object, each sheet object has 2
   * fields: label and grid. here's a sample definition:
   *
   * {
   *  sheets: [ {
   *    label: 'part1',
   *    grid: [
   *      ['1', { val: 2, style: {}, readOnly: true }, '3'],
   *      ['=A1+SHEET2:A2'],
   *    ],
   *  }, {
   *    label: 'part2',
   *    grid: [
   *      ['123'],
   *    ]
   *  }
   *  ],
   * }
   *
   * a grid/cell's definition could has the following fields:
   *  * label
   *  * readOnly
   *  * style - could be an object or string
   *  * val - value of the cell
   * */
  constructor(def, options={ translateLabel: false }) {
    this.def = def;
    let analyzer = this;
    this.labelMaps = {};
    this.sheets = def.sheets.map(function ({label, grid=[]}, idx) {
      var cells = {};
      let [cellDef, i, j] = getNextCellDef(grid, 0, 0);
      let sheet = 'SHEET' + (idx + 1);
      while (cellDef != void 0) {
        let tag = makeTag(i, j);
        cellDef = analyzer.normalize(cellDef);
        cells[tag] = cellDef;
        if (cellDef.label) {
          if (!analyzer.labelMaps[idx]) {
            analyzer.labelMaps[idx] = {};
          }
          analyzer.labelMaps[idx][cellDef.label.toUpperCase()] = tag;
        }
        j++;
        let row = grid[i].cells || grid[i];
        if (j == row.length) {
          j = 0;
          i++;
        }
        [cellDef, i, j] = getNextCellDef(grid, i, j);
      }
      return {
        idx: idx,
        label: label || sheet,
        cells,
      };
    });
    if (options.translateLabel) {
      for (let [currentSheetIdx, sheet] of this.sheets.entries()) {
        for (let tag in sheet.cells) {
          let cell = sheet.cells[tag];
          if (!cell.__primitive) {
            let lexer = new Lexer(cell.__script);
            let tokens = Array.from(lexer.tokens).map(function (token) {
              if (token.type == Token.REF) {
                let { sheet, name } = token.value;
                let sheetIdx = 0;
                if (sheet == '') {
                  sheetIdx = currentSheetIdx;
                } else {
                  for (; sheetIdx < analyzer.sheets.length; ++sheetIdx) {
                    if (analyzer.sheets[sheetIdx].label == sheet) {
                      break;
                    }
                  }
                  if (sheetIdx == analyzer.sheets.length) {
                    throw new Error('unkown sheet: ' + sheet);
                  }
                }
                let tagName = analyzer.getTagByLabel(sheetIdx, name);
                if (tagName == void 0) {
                  throw new Error('unknown label: ' + name);
                }
                return new Token(Token.VARIABLE, {
                  sheet: sheet,
                  name: tagName,
                });
              }
              return token;
            });
            cell.__script = tokens.map(unlex).join('');
            cell.val = '=' + cell.__script;
          }
        }
      }
    }
  }
  /**
   * Get all the cell definitions that pass the given test
   *
   * @param {function} [test] - a function that take a cell definition as
   * argument, return true if cell passes the test, otherwise false
   *
   * @return {array} - all the cell definitions if test is not provided, or
   *  just those pass test if test is provided, each elements is and object with
   *  fields:
   *    * sheetIdx
   *    * tag
   *    * def
   * */
  searchCells(test) {
    let ret = [];
    for (let sheet of this.sheets) {
      let {idx: sheetIdx, cells} = sheet;
      for (let tag in cells) {
        let cell = cells[tag];
        if (!test || test(cell)) {
          ret.push({
            sheetIdx,
            tag,
            def: cell,
          });
        }
      }
    }
    return ret;
  }
  /**
   * normalize a cell's definition and normalize it
   * */
  normalize(cellDef) {
    if (typeof cellDef === 'number') {
      cellDef = String(cellDef);
    }
    if (typeof cellDef === 'string') {
      cellDef = {
        val: cellDef,
      };
    }
    let val = cellDef.val = cellDef.val || '';
    let primitive = val[0] != '=';
    let dependencies = [];
    let script;
    if (!primitive) {
      script = val.slice(1);
      let lexer = new Lexer(script);
      for (var token of lexer.tokens) {
        if (token.type === Token.VARIABLE) {
          dependencies.push(token);
        } else if (token.type === Token.REF) {
          dependencies.push(token);
        }
      }
    }
    return Object.assign(cellDef, {
      __primitive: primitive,
      __dependencies: dependencies,
      __script: script,
    });
  }
  getTagByLabel(sheetIdx, label) {
    return (this.labelMaps[sheetIdx] || {})[label.toUpperCase()];
  }
  getCellDef(sheetIdx, tag) {
    let sheet = this.sheets[sheetIdx];
    if (!sheet) {
      return;
    }
    return (sheet.cells || {})[tag];
  }
  setCellDef(sheetIdx, tag, def) {
    let sheet = this.sheets[sheetIdx];
    if (!sheet) {
      return;
    }
    if (sheet.cells == void(0)) {
      sheet.cells = {};
    }
    return sheet.cells[tag] = this.normalize(def);
  }
  getSheet(sheetIdx) {
    return this.sheets[sheetIdx];
  }
}

export default Analyzer;
