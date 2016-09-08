import makeTag from './make-tag';
import { Lexer, Token } from './script/lexer.js';

/**
 * split var name to sheetName and tag
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

export var skipUndefined = function skipUndefined(grids, i, j) {
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
 * Analyzer of grid source file
 * */
class Analyzer {
  constructor(def) {
    this.def = def;
    let analyzer = this;
    this.sheets = def.sheets.map(function ({label, grids=[]}, idx) {
      var cells = {};
      let [cellDef, i, j] = skipUndefined(grids, 0, 0);
      while (cellDef != undefined) {
        let tag = makeTag(i, j);
        cells[tag] = analyzer.analyze(cellDef);
        j++;
        if (j == grids[i].length) {
          j = 0;
          i++;
        }
        [cellDef, i, j] = skipUndefined(grids, i, j);
      }
      return {
        idx: idx,
        label: label || ('SHEET' + (idx + 1)),
        cells,
      };
    });
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
    return sheet.cells[tag] = this.analyze(def);
  }
  getSheet(sheetIdx) {
    return this.sheets[sheetIdx];
  }
};

export default Analyzer;
