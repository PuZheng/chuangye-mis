import $$ from '../slot/';
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
    this.$$mode = $$(CellMode.DEFAULT, `cel-${this.tag}-mode`);
    this.$$view = this.makeView();
  }
  get onclick() {
    let cell = this;
    if (cell.$$mode.val() === CellMode.DEFAULT) {
      return function onclick() {
        let args = [
          [cell.$$mode, CellMode.SELECTED],
        ];
        let focusedCell = cell.$$focusedCell.val();
        if (focusedCell && (focusedCell.tag != cell.tag)) {
          args.push([focusedCell.$$mode, CellMode.DEFAULT]);
        }
        args.push([cell.$$focusedCell, cell]);
        $$.update(...args);
      };
    }
  }
  get ondblclick() {
    let cell = this;
    if (!cell.def.readOnly && cell.$$mode.val() != CellMode.EDIT) {
      return function () {
        let args = [
          [cell.$$mode, CellMode.EDIT]
        ];
        let focusedCell = cell.$$focusedCell.val();
        if (focusedCell && (focusedCell.tag != cell.tag)) {
          args.push([focusedCell.$$mode, CellMode.DEFAULT]);
        };
        args.push([cell.$$focusedCell, cell]);
        $$.update(...args);
      };
    }
  }
  makeView() {
    let cell = this;
    return $$.connect([this.$$val, this.$$mode], function (val, mode) {
      let className = [cell.tag];
      if (cell.def.readOnly) {
        className.push('readonly');
      }
      let selected = mode == CellMode.SELECTED;
      if (selected) {
        className.push('-selected');
      }
      let editing = mode == CellMode.EDIT;
      if (editing) {
        className.push('-editing');
      }
      return h('td' + className.map( i => '.' + i ), {
        style: cell.def.style,
        onclick: cell.onclick,
        ondblclick: cell.ondblclick, 
      }, [
        cell.makeContentVnode(cell.def, val, editing),
        cell.makeEditor(cell.def, val, editing, function (val) {
          $$.update(
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
    return h('input.editor', {
      type: 'text',
      value: val,
      style: editing? {
      }: {
        display: 'none',
      }, 
      onfocus: function moveCaretAtEnd (e) {
        var temp_value = e.target.value;
        e.target.value = '';
        e.target.value = temp_value;
      },
      onkeydown: function (e) {
        if (e.keyCode == 27 || e.keyCode == 13) {
          e.stopPropagation();
          onChangeCb(this.value);
          return true;
        }
      },
      onblur: function () {
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
  constructor(def) {
    this.def = def;
    this.$$focusedCell = $$(null, 'focused-cell');
    var sg = this;
    this.$$view = $$(h('.smart-grid', [
      h('.table', {
        hook: new class Hook {
          hook(node) {
            sg.tableEl = node;
          }
        },
      }, [
        h('div', [
          h('.v-h-header'), 
          h('.top-label-row', h('.header', 'A')),
        ]),
        h('div', h('.v-header', '1'))
      ])
    ]), 'view');
    this.tableEl = null;
    this.$$actualWidth = $$(0, 'actual-width');
    this.$$viewportWidth = $$(0, 'viewport-width');
    this.$$left = $$(0, 'left');
    this.$$height = $$(0, 'height');
    this.$$viewportHeight = $$(0, 'viewport-height');
  }
  isPrimitive(val) {
    return val[0] != '=';
  }
  makeSlot(script, ...tags) {
    for (var tag of tags) {
      let [row, col] = parseTag(tag);
      if (!this.env[row][col]) {
        if (!this.dependencyMap[tag]) {
          this.env[row][col] = $$(this.getCellVal(row, col), `cell-${tag}-val`);
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
    return $$.connect(valSlots, function (tags) {
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
      this._env = range(0, this.def.rows).map(() => Array(this.def.columns));
      // first round, setup tag dependency map
      // second round, create slots
      for (var i = 0; i < this.def.rows; ++i) {
        for (var j = 0; j < this.def.columns; ++j) {
          let tag = makeTag(i, j);
          let cellVal = this.getCellVal(i, j);
          if (!this.dependencyMap[tag]) {
            if (!this._env[i][j]) {
              this._env[i][j] = $$(cellVal, `cell-${tag}-val`);
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
  setupLayout() {
    let vHeader = this.tableEl.getElementsByClassName('v-header')[0];
    let hHeader = this.tableEl.getElementsByClassName('h-header')[0];
    this.vHeaderWidth = vHeader.offsetWidth;
    this.hHeaderHeight = hHeader.offsetHeight;
    this.cellWidth = hHeader.offsetWidth;
    this.cellHeight = vHeader.offsetHeight;
    var viewportWidth = this.tableEl.offsetWidth - this.hHeaderHeight;
    var viewportHeight = this.tableEl.offsetWidth - this.vHeaderWidth;
    $$.update(
      [this.$$viewportWidth, viewportWidth],
      [this.$$viewportHeight, viewportHeight],
      [this.$$actualWidth, 2 * viewportWidth],
      [this.$$height, 2 * viewportHeight]
    );
    let $$activeTab = $$(0, 'active-tab');
    let tabNames = [];
    for (var [tabName] of this.def.grids) {
      tabNames.push(tabName);
    }
    this.$$view.connect([$$activeTab, this.$$vScrollbar, this.$$hScrollbar, this.$$table], function (activeTab, vScrollbar, hScrollbar, table) {
      return h('.smart-grid', [
        table,
        hScrollbar,
        vScrollbar,
        h('.tabs', tabNames.map(function (tn, idx) {
          return h('a' + (idx == activeTab? '.active': ''), {
            href: '#',
            onclick() {
              if (idx != activeTab) {
                $$activeTab.val(idx);
              }
              return false;
            }
          }, tn);
        }))
      ]);
    }).update();
  }
  // get $$view() {
  //   return this._$$view;
  //   if (!this._$$view) {
      // var grid = this;
      // let $$topHeaderRowVn = $$.connect([grid.$$focusedCell], function (focusedCell) {
      //   return h('tr.header', [
      //     h('th', ''),
      //     ...range(0, grid.def.columns).map(function (idx) { 
      //       let classNames = [];
      //       let focused = focusedCell && focusedCell.col === idx;
      //       focused && classNames.push('-focused');
      //       classNames = classNames.map( c => '.' + c ).join('');
      //       return h('th' + classNames, toColumnIdx(idx));
      //     }),
      //   ]);
      // }, 'top-header-row');
      // let $$rows = range(0, grid.def.rows).map(function (row) {
      //   let $$cols = grid.cells[row].map( c => c.$$view );
      //   return $$.connect([grid.$$focusedCell, ...$$cols], function (focusedCell, ...cols) {
      //     let classNames = [];
      //     let focused = focusedCell && focusedCell.row === row;
      //     focused && classNames.push('-focused');
      //     classNames = classNames.map( c => '.' + c ).join('');
      //     let leftHeaderCol = h('th' + classNames, String(row + 1));
      //     return h('tr', [
      //       leftHeaderCol
      //     ].concat(cols));
      //   }, 'row-' + row);
      // });
      // this._$$view = $$.connect([grid.$$focusedCell, $$topHeaderRowVn, ...$$rows], function (focusedCell, topHeaderRow, ...rows) {
      //   return [
      //     h('input', {
      //       value: focusedCell && (grid.getCellVal(focusedCell.row, focusedCell.col) || focusedCell.$$val.val())
      //     }),
      //     h('table.sg.smart-grid', [
      //       h('thead', topHeaderRow),
      //       h('tbody', rows),
      //     ])
      //   ];
      // }, 'smart-grid');
      // var $$tabs = [];
      // var tabNames = [];
      // for (var [tabName, def] of this.def.grids) {
      //   // $$tabs.push(this.makeTabSlot(tabName, def));
      //   tabNames.push(tabName);
      // }
      // let $$activeTab = $$(0, 'active-tab');
      // this._$$view = $$.connect([$$activeTab, this.$$vScrollbar, this.$$hScrollbar, this.$$table], function (activeTab, vScrollbar, hScrollbar, table) {
      //   // let tab = tabs[activeTab];
      //   return h('.smart-grid', [
      //     table,
      //     hScrollbar,
      //     vScrollbar,
      //     h('.tabs', tabNames.map(function (tn, idx) {
      //       return h('a' + (idx == activeTab? '.active': ''), {
      //         href: '#',
      //         onclick() {
      //           if (idx != activeTab) {
      //             $$activeTab.val(idx);
      //           }
      //           return false;
      //         }
      //       }, tn);
      //     }))
      //   ]);
      // });
    // }
    // return this._$$view;
  // }
  getVisibleCols() {
    let start = Math.floor(this.$$left.val() * this.$$actualWidth.val() / this.cellWidth);
    return range(
      start,
      start + Math.floor((this.$$viewportWidth.val() - 1) / this.cellWidth) + 1
    );
  }
  get $$topLabelRow() {
    var sg = this;
    var $$topLabelCells = range(0, Math.floor((this.$$viewportWidth.val() - 1) / this.cellWidth) + 1).map(function (idx) {
      return $$.connect([sg.$$left, sg.$$actualWidth], function (left, actualWidth) {
        let offset = Math.floor((left * actualWidth) / sg.cellWidth);
        return h('.header', toColumnIdx(idx + offset));
      });
    });
    return $$.connect($$topLabelCells, function (...cells) {
      return h('.top-label-row', cells);      
    });
  }
  get $$table() {
    return $$.connect([this.$$topLabelRow], function (topLabelRow) {
      return h('.table', [
        h('.v-h-header'),
        topLabelRow,
      ]);
    });
    // return $$.connect([this.$$left, this.$$viewportWidth], function (left, viewportWidth) {
    //   let visibleCols = sg.getVisibleCols();
    //   return h('.table', [
    //     h('div', {
    //       style: {
    //         width: viewportWidth + sg.cellWidth + sg.vHeaderWidth + 'px',
    //       }
    //     }, [h('.v-h-header')].concat(visibleCols.map(function (col) {
    //       return h('.h-header', toColumnIdx(col));
    //     }))),
    //   ]);
    // });
  }
  get $$hScrollbar() {
    let $$dragging = $$(false, 'dragging');
    let railEl;
    let smartGrid = this;
    return $$.connect([this.$$viewportWidth, this.$$actualWidth, $$dragging, this.$$left], function (viewportWidth, actualWidth, dragging, left) {
      return h('.h-scrollbar' + (dragging? '.dragging': ''), {
        hook: new class Hook {
          hook(el) {
            railEl = el;
          }
        },
      }, [
        actualWidth * viewportWidth != 0? h('.bar', {
          style: {
            width: (viewportWidth / actualWidth) * 100 + '%',
            left: left * 100  + '%',
          }, 
          // note, this function won't be recreated, so 
          // it always remembers the first "left" etc.
          onmousedown(e) {
            $$dragging.toggle();
            let lastX = e.clientX;
            let scrollbarWidth = this.offsetWidth;
            let onmouseup = function () {
              $$dragging.toggle();
              document.removeEventListener('mouseup', onmouseup);
              document.removeEventListener('mousemove', onmousemove);
            };
            document.addEventListener('mouseup', onmouseup);
            let onmousemove = function (left) {
              return function (e) {
                // why prevent default? http://stackoverflow.com/questions/9776086/how-to-disable-drag-drop-functionality-in-chrome
                e.preventDefault();
                let railWidth = railEl.offsetWidth;
                left = (left * railWidth + (e.clientX - lastX)) / railWidth;
                if (left < 0) {
                  left = 0;
                  smartGrid.$$left.val(left);
                  return;
                }
                smartGrid.$$left.val(left);
                // met the end
                if (left * railWidth + scrollbarWidth >= railWidth) {
                  let scrolledWidth = actualWidth - viewportWidth;
                  let newGridWidth = actualWidth + viewportWidth;
                  left = scrolledWidth / newGridWidth;
                  smartGrid.$$left.val(left);
                  smartGrid.$$actualWidth.val(newGridWidth);
                } else {
                  lastX = e.clientX;
                }
              };
            }(left);
            document.addEventListener('mousemove', onmousemove);
          },
        }): '',
      ]);
    });
  }
  get $$vScrollbar() {
    return $$.connect([this.$$viewportHeight, this.$$height], function (viewportHeight, height) {
      return h('.v-scrollbar', [
        viewportHeight * height != 0? h('.bar', {
          style: {
            height: (viewportHeight / height) * 100 + '%',
          }
        }): '',
      ]);
    });
  }
  makeTabSlot(tabName) {
    tabName;
    return $$.connect([], function () {
      return h('.tab', [
        h('table', [
          // h('thead', topHeaderRow);
        ])
      ]);
    });
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
      $$.update(...args);
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
    $$.update(...args);
    return true;
  }
};

SmartGrid.onUpdated = function (node) {
  var inputEl = node.querySelector('td.-editing > input');
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
