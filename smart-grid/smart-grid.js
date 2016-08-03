import x from '../js/xx.js';
import { Lexer, Token } from './script/lexer.js';
import { Parser } from './script/parser.js';
import { Interpreter } from './script/interpreter.js';
import { h } from 'virtual-dom';

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

class Cell {
  constructor(row, col, def, $$val, $$selectedCell, $$editingCell) {
    this.row = row;
    this.col = col;
    this.tag = makeTag(row, col);
    this.def = def;
    this.$$selectedCell = $$selectedCell;
    this.$$editingCell = $$editingCell;
    this.$$val = $$val;
    this.$$selected = x(false, `cel-${this.tag}-selected`);
    this.$$editing = x(false, `cel-${this.tag}-editing`);
    this.$$view = this.makeView();
  }
  get onclick() {
    let cell = this;
    if (!cell.$$selected.val() && !cell.$$editing.val()) {
      return function onclick(e) {
        let args = [
          [cell.$$selected, true],
        ];
        let selectedCell = cell.$$selectedCell.val();
        if (selectedCell) {
          args.push([selectedCell.$$selected, false]);
        }
        args.push([cell.$$selectedCell, cell]);
        x.update(...args);

      };
    }
  }
  get ondblclick() {
    let cell = this;
    if (!cell.def.readOnly && !cell.$$editing.val()) {
      return function (e) {
        if (cell.$$editing.val()) {
          let args = [
            [cell.$$selected, false],
            [cell.$$editing, true],
          ];
          let editingCell = cell.$$editingCell.val();
          if (editingCell) {
            args.push([editingCell.$$selected, false]);
          };
          args.push([cell.$$selectedCell, null]);
          args.push([cell.$$editingCell, null]);
          x.update(...args);
        }
      };
    }
  }
  makeView() {
    let cell = this;
    return x.connect([this.$$val, this.$$selected, this.$$editing], function (val, selected, editing) {
      let className = [cell.tag];
      if (selected) {
        className.push('selected');
      }
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
            [cell.$$editing, false],
            [cell.$$selected, false],
            [cell.$$selectedCell, null],
            [cell.$$editingCell, null]
          );
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
          onChangeCb(this.value);
          return false;
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
  constructor(def, data=[]) {
    this.def = def;
    this.data = data;
    this.$$selectedCell = x(null, 'selected-cell');
    this.$$editingCell = x(null, 'editing-cell');
  }
  isPrimitive(val) {
    return val[0] != '=';
  }
  makeSlot(script, ...tags) {
    for (var tag of tags) {
      let [row, col] = parseTag(tag);
      if (!this._env[row][col]) {
        if (!this._dependencyMap[tag]) {
          this._env[row][col] = x(this.getCellVal(row, col), `cell-${tag}-val`);
        } else {
          this._env[row][col] = this.makeSlot.apply(this, this._dependencyMap[tag]);
        }
      }
    }
    let valSlots = tags.map(function (grid) {
      return function (tag) {
        let [row, col] = parseTag(tag);
        return grid._env[row][col];
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
  get $$view() {
    if (!this._$$view) {
      var grid = this;
      let topHeaderRowVn = h('tr', [
        h('th', {
          style: {
            padding: '0.1em 0' 
          }
        }, ''),
        ...range(0, this.def.columns).map(idx => h('th', {
          style: {
            textAlign: 'center',
            padding: '0.1em 0' 
          }
        }, toColumnIdx(idx)))
      ]);
      let $$rows = range(0, grid.def.rows).map(function (row) {
        let leftHeaderCol = h('th', { 
          style: {
            padding: '0.2em 0',
            textAlign: 'center',
            background: '#F9FAFB',
          }
        }, row + 1);
        let $$cols = range(0, grid.def.columns).map(function (col) {

          return new Cell(row, col, grid.getCellDef(row, col), grid.env[row][col], grid.$$selectedCell, grid.$$editingCell).$$view;
        });
        return x.connect($$cols, function (...cols) {
          return h('tr', [
            leftHeaderCol
          ].concat(cols));
        }, 'row-' + row);
      });
      this._$$view = x.connect($$rows, function (...rows) {
        return h('table.ui.celled.compact.striped.table', [
          h('thead', topHeaderRowVn),
          h('tbody', rows),
        ]);
      }, 'smart-grid');
    }
    return this._$$view;
  }
};

SmartGrid.didMount = function (node) {
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
