import x from '../js/xx.js';
import { Lexer, Token } from './script/lexer.js';
import { Parser } from './script/parser.js';
import { Interpreter } from './script/interpreter.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

const makeTag = function (row, col) {
  return `${toColumnIdx(col)}${row + 1}`;
};

/**
 * change to column index notation, this notation is very bizzare, for example:
 * 0 -> A  // assume A denotes 0
 * ...
 * 25 -> Z
 * but, 26, which is '10' as 26-based integer, converted to 'AA' (which should be 'BA' if we assume B denotes 1),
 * so the most significant digit should be minus one. 
 * This flow shows how 26 is changed to 'AA'
 * 26 -> 10 -> BA -> AA 
 * */
var toColumnIdx = function (idx) {
  var idx = Number(idx).toString(26).split('').map(c => parseInt(c, 26) + 'A'.charCodeAt(0));
  if (idx.length > 1) {
    --idx[0];
  }
  return idx.map(i => String.fromCharCode(i)).join('');
};

var fromColumnIdx = function (idx) {
  var idx = idx.split('').map(c => c.charCodeAt(0) - 'A'.charCodeAt(0));
  if (idx.length > 1) {
    ++idx[0];
  }
  return idx.reverse().map((i, idx) => i * Math.pow(26, idx)).reduce((s, i) => s + i);
};

var parseTag = function () {
  let re = /([A-Z]+)(\d+)/;
  return function (tag) {
    // note, tag is composed by col + row
    var [col, row] = re.exec(tag).slice(1);
    return [row - 1, fromColumnIdx(col)];
  };
}();

export const CellMode = {
  EDIT: 'EDIT',
  SELECTED: 'SELECTED',
  DEFAULT: 'DEFAULT',
};

class Cell {
  constructor(row, col, def, $$val, $$focusedCell) {
    this.row = row;
    this.col = col;
    this.tag = makeTag(row, col);
    this.def = def;
    this.$$focusedCell = $$focusedCell;
    this.$$val = $$val;
    this.$$mode = x(CellMode.DEFAULT, `cel-${this.tag}-mode`);
    this.$$view = this.makeView();
  }
  get onclick() {
    let cell = this;
    if (cell.$$mode.val() === CellMode.DEFAULT) {
      return function onclick(e) {
        let args = [
          [cell.$$mode, CellMode.SELECTED],
        ];
        let focusedCell = cell.$$focusedCell.val();
        if (focusedCell && (focusedCell.tag != cell.tag)) {
          args.push([focusedCell.$$mode, CellMode.DEFAULT]);
        }
        args.push([cell.$$focusedCell, cell]);
        x.update(...args);
      };
    }
  }
  get ondblclick() {
    let cell = this;
    if (!cell.def.readOnly && cell.$$mode.val() != CellMode.EDIT) {
      return function (e) {
        let args = [
          [cell.$$mode, CellMode.EDIT]
        ];
        let focusedCell = cell.$$focusedCell.val();
        if (focusedCell && (focusedCell.tag != cell.tag)) {
          args.push([focusedCell.$$mode, CellMode.DEFAULT]);
        };
        args.push([cell.$$focusedCell, cell]);
        x.update(...args);
      };
    }
  }
  makeView() {
    let cell = this;
    return x.connect([this.$$val, this.$$mode], function (val, mode) {
      let className = [cell.tag];
      if (cell.def.readOnly) {
        className.push('readonly');
      }
      let selected = mode == CellMode.SELECTED;
      if (selected) {
        className.push('selected');
      }
      let editing = mode == CellMode.EDIT;
      if (editing) {
        className.push('editing');
      }
      let style = Object.assign({}, {
        padding: '0.2em 0',
        textAlign: 'center',
      }, cell.def.style);
      selected && Object.assign(style, {
        background: 'lightpink',
      });
      return h('td' + className.map( i => '.' + i ), {
        style,
        onclick: cell.onclick,
        ondblclick: cell.ondblclick, 
      }, [
        cell.makeContentVnode(cell.def, val, editing),
        cell.makeEditor(cell.def, val, editing, function (val) {
          x.update(
            [cell.$$val, val],
            [cell.$$mode, CellMode.SELECTED]
          );
          return false;
        }),
      ]);
    }, 'cell-' + this.tag);
  }
  makeEditor(def, val, editing, onChangeCb) {
    // it could be more sophisticated
    return h('input', {
      type: 'text',
      value: val,
      style: editing? {}: {
        display: 'none',
      }, 
      onkeydown: function (e) {
        if (e.keyCode == 27 || e.keyCode == 13) {
          e.stopPropagation();
          onChangeCb(this.value);
          return true;
        }
      },
      onblur: function (e) {
        onChangeCb(this.value);
      },
    });
  }
  makeContentVnode(def, val, editing) {
    // it could be more sophisticated
    return h('span', editing? {
      style: {
        display: 'none'
      }
    }: {}, String(val));
  }
}

export class SmartGrid {
  constructor(data) {
    this.def = data.def;
    this.data = data.data;
    this.$$focusedCell = x(null, 'focused-cell');
  }
  isPrimitive(val) {
    return val[0] != '=';
  }
  makeSlot(script, ...tags) {
    for (var tag of tags) {
      let [row, col] = parseTag(tag);
      if (!this.env[row][col]) {
        if (!this.dependencyMap[tag]) {
          this.env[row][col] = x(this.getCellVal(row, col), `cell-${tag}-val`);
        } else {
          this.env[row][col] = this.makeSlot.apply(this, this.dependencyMap[tag]);
        }
      }
    }
    let valSlots = tags.map(function (grid) {
      return function (tag) {
        let [row, col] = parseTag(tag);
        return grid.env[row][col];
      };
    }(this));
    return x.connect(valSlots, function (tags) {
      return function (...slots) {
        let env = {};
        for (var i = 0; i < tags.length; ++i) {
          env[tags[i]] = slots[i];
        }
        let lexer = new Lexer(script);
        let parser = new Parser(lexer);
        return new Interpreter(parser.expr, env).eval();
      };
    }(tags));
  }
  get dependencyMap() {
    if (!this._dependencyMap) {
      this._dependencyMap = {};
      for (var i = 0; i < this.def.rows; ++i) {
        for (var j = 0; j < this.def.columns; ++j) {
          let cellVal = this.getCellVal(i, j);
          if (!this.isPrimitive(cellVal)) {
            let lexer = new Lexer(cellVal.slice(1));
            let tag = makeTag(i, j);
            let tokens = [];
            for (var token of lexer.tokens) {
              if (token.type === Token.VARIABLE) {
                tokens.push(token);
              }
            }
            this._dependencyMap[tag] = tokens.map( t => t.value );
          } 
        }
      }
    }
    return this._dependencyMap;
  }
  get env() {
    if (!this._env) {
      this._env = range(0, this.def.rows).map(row => Array(this.def.columns));
      // first round, setup tag dependency map
      // second round, create slots
      for (var i = 0; i < this.def.rows; ++i) {
        for (var j = 0; j < this.def.columns; ++j) {
          let tag = makeTag(i, j);
          let cellVal = this.getCellVal(i, j);
          if (!this.dependencyMap[tag]) {
            if (!this._env[i][j]) {
              this._env[i][j] = x(cellVal, `cell-${tag}-val`);
            }
          } else {
            this._env[i][j] = this.makeSlot.apply(this, [cellVal.slice(1), ...this.dependencyMap[tag]]);
          }
        }
      }
    }
    return this._env;
  }
  getCellVal(row, col) {
    return ((this.data || [])[row] || [])[col] || '';
  }
  getCellDef(row, col) {
    return ((((this.def.grids || [])[row] || [])[col]) || {});
  }
  get cells() {
    if (!this._cells) {
      let grid = this;
      let newCell = function (row, col) {
        return new Cell(row, col, grid.getCellDef(row, col), grid.env[row][col], grid.$$focusedCell);
      };
      this._cells = range(0, grid.def.rows).map(function newRow(row) {
        return range(0, grid.def.columns).map(col => newCell(row, col));
      });
    }
    return this._cells;
  }
  get $$view() {
    if (!this._$$view) {
      var grid = this;
      let $$topHeaderRowVn = x.connect([grid.$$focusedCell], function (focusedCell) {
        return h('tr', [
          h('th', {
            style: {
              padding: '0.1em 0' 
            }
          }, ''),
          ...range(0, grid.def.columns).map(function (idx) { 
            let style = {
              textAlign: 'center',
              padding: '0.1em 0' 
            };
            if (focusedCell && focusedCell.col === idx) {
              style.background = 'lightpink';
            }
            return h('th', {
              style, 
            }, toColumnIdx(idx));
          }),
        ]);
      }, 'top-header-row');
      let $$rows = range(0, grid.def.rows).map(function (row) {
        let $$cols = grid.cells[row].map( c => c.$$view );
        return x.connect([grid.$$focusedCell, ...$$cols], function (focusedCell, ...cols) {
          let style = {
            padding: '0.4em',
            textAlign: 'center',
            background: '#F9FAFB',
          };
          if (focusedCell && focusedCell.row === row) {
            style.background = 'lightpink';
          }
          let leftHeaderCol = h('th', { 
            style,
          }, row + 1);
          return h('tr', [
            leftHeaderCol
          ].concat(cols));
        }, 'row-' + row);
      });
      this._$$view = x.connect([grid.$$focusedCell, $$topHeaderRowVn, ...$$rows], function (focusedCell, topHeaderRow, ...rows) {
        return [
          h('.ui.top.attached.basic.segment', {
            style: {
              padding: 0
            }
          }, [
            h('input', {
              value: focusedCell && (grid.getCellVal(focusedCell.row, focusedCell.col) || focusedCell.$$val.val())
            }),
          ]),
          h('table.ui.celled.compact.striped.table.bottom.attached', [
            h('thead', topHeaderRow),
            h('tbody', rows),
          ])
        ];
      }, 'smart-grid');
    }
    return this._$$view;
  }
  moveLeft() {
    var focusedCell = this.$$focusedCell.val();
    if (focusedCell) {
      if (focusedCell.$$mode.val() === CellMode.SELECTED) {
        this.select(focusedCell.row, focusedCell.col - 1);
      }
    } else {
      this.select(0, 0);
    }
  }
  moveUp() {
    var focusedCell = this.$$focusedCell.val();
    if (focusedCell) {
      if (focusedCell.$$mode.val() === CellMode.SELECTED) {
        this.select(focusedCell.row - 1, focusedCell.col);
      }
    } else {
      this.select(0, 0);
    }
  }
  moveRight() {
    var focusedCell = this.$$focusedCell.val();
    if (focusedCell) {
      if (focusedCell.$$mode.val() === CellMode.SELECTED) {
        this.select(focusedCell.row, focusedCell.col + 1);
      }
    } else {
      this.select(0, 0);
    }
  }
  moveDown() {
    var focusedCell = this.$$focusedCell.val();
    if (focusedCell) {
      if (focusedCell.$$mode.val() === CellMode.SELECTED) {
        this.select(focusedCell.row + 1, focusedCell.col);
      }
    } else {
      this.select(0, 0);
    }
  }
  select(row, col) {
    if (row >= 0 && row < this.def.rows && col >= 0 && col < this.def.columns) {
      var focusedCell = this.$$focusedCell.val();
      let args = [
        [this.$$focusedCell, this.cells[row][col]],
        [this.cells[row][col].$$mode, CellMode.SELECTED],
      ];
      if (focusedCell)  {
        args.push([focusedCell.$$mode, CellMode.DEFAULT]);
      }
      x.update(...args);
    }
  }
  edit(row, col) {
    if (row === undefined || col === undefined) {
      var focusedCell = this.$$focusedCell.val();
      if (focusedCell) {
        return this.edit(focusedCell.row, focusedCell.col);
      }
      return false;
    }
    if (this.getCellDef(row, col).readOnly) {
      return false;
    }
    let args = [
      [this.$$focusedCell, this.cells[row][col]],
      [this.cells[row][col].$$mode, CellMode.EDIT],
    ];
    var focusedCell = this.$$focusedCell.val();
    if (focusedCell && (focusedCell.row != row || focusedCell.col != col)) {
      args.push(focusedCell.$$mode, CellMode.DEFAULT);
    }
    x.update(...args);
    return true;
  }
};

SmartGrid.onUpdated = function (node) {
  var inputEl = node.querySelector('td.editing > input');
  inputEl && inputEl.focus();
};

const range = function (start, end) {
  var a = Array(end - start);
  for (var i = start; i < end; ++i) {
    a[i - start] = i;
  }
  return a;
};

export default SmartGrid;
