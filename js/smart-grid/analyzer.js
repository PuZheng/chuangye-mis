import makeTag from './make-tag';
import { Lexer, Token } from './engine/lexer.js';

/**
 * get next cell definition from raw definitions.
 *
 * @param {Array} grids - raw cell definition
 * @param {Number} i - row of start position
 * @param {Number} j - column of start position
 *
 * @return {Array} - next cell definition and its position, eg.
 *  [nextCellDef, nextRow, nextCol], or [void(0] if there's no next cell
 *  definition
 * */
export var getNextCellDef = function getNextCellDef(grids, i, j) {
  let cellDef;
  while (i < grids.length) {
    let row = grids[i];
    while (j < row.length && row[j] === void(0)) {
      ++j;
    }
    if (row[j] === void(0)) {
      ++i;
      continue;
    }
    cellDef = row[j];
    break;
  }
  if (cellDef) {
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
   * fields: label and grids. here's a sample definition:
   *
   * {
   *  sheets: [ {
   *    label: 'part1',
   *    grids: [
   *      ['1', { val: 2, style: {}, readOnly: true }, '3'],
   *      ['=A1+SHEET2:A2'],
   *    ],
   *  }, {
   *    label: 'part2',
   *    grids: [
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
  constructor(def) {
    this.def = def;
    let analyzer = this;
    this.labelMaps = {};
    this.sheets = def.sheets.map(function ({label, grids=[]}, idx) {
      var cells = {};
      let [cellDef, i, j] = getNextCellDef(grids, 0, 0);
      let sheet = ('SHEET' + (idx + 1));
      while (cellDef != void(0)) {
        let tag = makeTag(i, j);
        cellDef = analyzer.normalize(cellDef);
        cellDef.tag = tag;
        cellDef.sheet = sheet;
        cells[tag] = cellDef;
        if (cellDef.label) {
          if (!analyzer.labelMaps[idx]) {
            analyzer.labelMaps[idx] = {};
          }
          analyzer.labelMaps[idx][cellDef.label] = tag;
        }
        j++;
        if (j == grids[i].length) {
          j = 0;
          i++;
        }
        [cellDef, i, j] = getNextCellDef(grids, i, j);
      }
      return {
        idx: idx,
        label: label || sheet,
        cells,
      };
    });
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
  getCellDefs(test) {
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
    if (typeof cellDef === 'string') {
      cellDef = {
        val: cellDef,
      };
    }
    let val = cellDef.val || '';
    let primitive = val[0] != '=';
    let dependencies = [];
    let script;
    if (!primitive) {
      let lexer = new Lexer(val.slice(1));
      for (var token of lexer.tokens) {
        if (token.type === Token.VARIABLE) {
          dependencies.push(token);
        } else if (token.type === Token.REF) {
          dependencies.push(token);
        }
      }
      script = val.slice(1);
    }
    return Object.assign(cellDef, {
      primitive,
      dependencies,
      script,
    });
  }
  getTagByLabel(sheetIdx, label) {
    return (this.labelMaps[sheetIdx] || {})[label];
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
    return sheet.cells[tag] = Object.assign(this.normalize(def), {
      tag,
    });
  }
  getSheet(sheetIdx) {
    return this.sheets[sheetIdx];
  }
}

export default Analyzer;
