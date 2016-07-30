import x from '../js/xx.js';
import sgScript from './sg-script.js';
var h = virtualDom.h;


var selectedCell;
var editingCell;

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
    var [col, row] = re.exec(tag).slice(1);
    return [row - 1, fromColumnIdx(col)];
  };
}();

class Cell {
  constructor(row, col, grid) {
    this.row = row;
    this.col = col;
    this.grid = grid;
    this.tag = makeTag(row, col);
    this.def = grid.getCellDef(row, col);
    this.$$val = grid.env[row][col];
    this.$$selected = x(false, `cel-${this.tag}-selected`);
    this.$$editing = x(false, `cel-${this.tag}-editing`);
    let cell = this;
    this.$$view = x.connect([this.$$val, this.$$selected, this.$$editing], function (val, selected, editing) {
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
        onclick: function () {
          if (!selected && !editing) {
            x.update(
              [cell.$$selected, true],
              ...(selectedCell? [[selectedCell.$$selected, false]]: [])
            );
            selectedCell = cell;
          }
        },
        ondblclick: cell.def.readOnly? undefined: function (e) {
          if (!editing) {
            x.update(  
                     [cell.$$selected, false],
                     [cell.$$editing, true],
                     ...(editingCell? [[editingCell.$$selected, false]]: [])
                    );
          }
          selectedCell = null;
          editingCell = cell;
        }
      }, [
        cell.makeContentVnode(cell.def, val, editing),
        cell.makeEditor(cell.def, val, editing, function (val) {
          x.update(
            [cell.$$val, val],
            [cell.$$editing, false],
            [cell.$$selected, false]
          );
          selectedCell = null;
          editingCell = null;
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

class SmartGrid {
  constructor(def, data) {
    this.def = def;
    this.data = data;
  }
  collectVariables(ast) {
    if (ast.type === 'variable') {
      return [ast];
    }
    return ast.children.map(c => this.collectVariables(c)).reduce((s, i) => s.concat(i));
  }
  isPrimitive(val) {
    return val[0] != '=';
  }
  makeDerivedSlot(script, ...tags) {
    for (var tag of tags) {
      let [row, col] = parseTag(tag);
      if (!this._env[row][col]) {
        if (!this._dependencyMap[tag]) {
          this._env[row][col] = x(this.getCellVal(row, col), `cell-${tag}-val`);
        } else {
          this._env[row][col] = this.makeDerivedSlot.apply(this, this._dependencyMap[tag]);
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
        let globals = {};
        for (var i = 0; i < tags.length; ++i) {
          globals[tags[i]] = slots[i];
        }
        return sgScript.eval(script, globals);
      };
    }(tags));
  }
  get env() {
    if (!this._env) {
      this._dependencyMap = {};
      this._env = range(0, this.def.rows).map(row => Array(this.def.columns));
      // first round, setup tag dependency map
      for (var i = 0; i < this.def.rows; ++i) {
        for (var j = 0; j < this.def.columns; ++j) {
          let cellVal = this.getCellVal(i, j);
          if (!this.isPrimitive(cellVal)) {
            this._dependencyMap[makeTag(i, j)] = this.collectVariabls(sgScript.makeAST(cellVal.slice(1))).map(v => v.name);
          } 
        }
      }
      // second round, create slots
      for (var i = 0; i < this.def.rows; ++i) {
        for (var j = 0; j < this.def.columns; ++j) {
          let tag = makeTag(i, j);
          let cellVal = this.getCellVal(i, j);
          if (!this._dependencyMap[tag]) {
            if (!this._env[i][j]) {
              this._env[i][j] = x(cellVal, `cell-${tag}-val`);
            }
          } else {
            this._env[i][j] = this.makeDerivedSlot.apply(this, [cellVal.slice(1), ...this._dependencyMap[tag]]);
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
          return new Cell(row, col, grid).$$view;
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

export default SmartGrid;

const range = function (start, end) {
  var a = Array(end - start);
  for (var i = start; i < end; ++i) {
    a[i - start] = i;
  }
  return a;
};
