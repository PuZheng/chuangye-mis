import makeTag from './make-tag';
import { Lexer, Token } from './script/lexer.js';

/**
 * split var name to sheetName and tag, eg. "sheet1:A3" => { 
 *  sheetName: 'sheet1',
 *  tag: 'A3'
 * }
 * */
let splitVarName = function (varName) {
  let arr = varName.split(':');
  let sheetName = '';
  let tag;
  if (arr.length > 1) {
    sheetName = arr[0];
    tag = arr[1];
  } else {
    tag = arr[0];
  }
  return {
    sheetName,
    tag
  };
};

/**
 * get next cell definition from raw definitions.
 *
 * @param {Array} grids - raw cell definition
 * @param {Number} i - row of start position
 * @param {Number} j - column of start position
 *
 * @return {Array} - next cell definition and its position, eg. 
 *  [nextCellDef, nextRow, nextCol], or [undefined] if there's no next cell 
 *  definition
 * */
export var getNextCellDef = function getNextCellDef(grids, i, j) {
  let cellDef;
  while (i < grids.length) {
    let row = grids[i];
    while (j < row.length && row[j] === undefined) {
      ++j;
    }
    if (row[j] === undefined) {
      ++i;
      continue;
    }
    cellDef = row[j];
    break;
  }
  if (cellDef) {
    return [cellDef, i, j];
  }
  return [undefined];
};


/*
 * Analyzer of smart grid raw definitions. 
 * */
class Analyzer {
  constructor(def) {
    this.def = def;
    let analyzer = this;
    this.sheets = def.sheets.map(function ({label, grids=[]}, idx) {
      var cells = {};
      let [cellDef, i, j] = getNextCellDef(grids, 0, 0);
      while (cellDef != undefined) {
        let tag = makeTag(i, j);
        cellDef = analyzer.analyze(cellDef);
        cellDef.tag = tag;
        cells[tag] = cellDef;
        j++;
        if (j == grids[i].length) {
          j = 0;
          i++;
        }
        [cellDef, i, j] = getNextCellDef(grids, i, j);
      }
      return {
        idx: idx,
        label: label || ('SHEET' + (idx + 1)),
        cells,
      };
    });
  }
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
  analyze(cellDef) {
    if (typeof cellDef === 'string') {
      cellDef = {
        val: cellDef,
      };
    }
    let val = cellDef.val;
    let primitive = val[0] != '=';
    let dependencies = [];
    let script;
    if (!primitive) {
      let lexer = new Lexer(val.slice(1));
      for (var token of lexer.tokens) {
        if (token.type === Token.VARIABLE) {
          dependencies.push(splitVarName(token.value));
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
    if (sheet.cells == undefined) {
      sheet.cells = {};
    };
    return sheet.cells[tag] = Object.assign(this.analyze(def), {
      tag,
    });
  }
  getSheet(sheetIdx) {
    return this.sheets[sheetIdx];
  }
};

export default Analyzer;
