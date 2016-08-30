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
    this.sheets = def.map(function ([name, { grids=[] }], idx) {
      var cells = {};
      let [cellDef, i, j] = skipUndefined(grids, 0, 0);
      while (cellDef != undefined) {
        let tag = makeTag(i, j);
        let val = (typeof cellDef === 'string')? cellDef: (cellDef.value || '');
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
        cells[tag] = {
          val, 
          tag,
          primitive, 
          dependencies,
          script,
        };
        j++;
        if (j == grids[i].length) {
          j = 0;
          i++;
        }
        [cellDef, i, j] = skipUndefined(grids, i, j);
      }
      return {
        name: name || ('SHEET' + (idx + 1)),
        cells,
      };
    });
  }
  getCellDef(sheetName, tag) {
    let sheet;
    for (var it of this.sheets) {
      if (it.name === sheetName) {
        sheet = it;
        break;
      }
    }
    if (!sheet) {
      return;
    }
    return (sheet.cells || {})[tag];
  }
};

export default Analyzer;
