import makeTag from './make-tag';

class Parser {
  constructor(def) {
    this.def = def;
  }
  get sheets() {
    let parser = this;
    let sheetCnt = 0;
    return {
      [Symbol.iterator]() { return this; },
      next() {
        if (sheetCnt < parser.def.length) {
          let [name, {grids}] = parser.def[sheetCnt];
          ++sheetCnt;
          let cells = function () {
            let i = 0, j = 0;
            let skipUndefined = function () {
              while (i < grids.length) {
                let row = grids[i];
                while (row[j] === undefined && j < row.length) {
                  ++j;
                }
                if (j == row.length) {
                  j = 0;
                  ++i;
                  continue;
                } 
                return row[j];
              }
            };
            return {
              [Symbol.iterator]() { return this; },
              next() {
                let cellDef = skipUndefined();
                let tag = makeTag(i, j);
                j++;
                if (j == grids[i].length) {
                  j = 0; 
                  i++;
                }
                if (cellDef !== undefined) {
                  return {
                    value: {
                      val: (typeof cellDef === 'string')? cellDef: (cellDef.value || ''),
                      tag,
                    },
                  };
                }
                return { done: true };
              }
            };
          }();
          return {
            value: {
              name: name || ('SHEET' + sheetCnt),
              cells,
            }
          };
        }
        return { done: true };
      }
    };
  }
};

export default Parser;
