import $$ from 'slot';
import Analyzer from './analyzer';
import DataSlotManager from './data-slot-manager';
import Cell from './cell';
import virtualDom from 'virtual-dom';
import pipeSlot from 'pipe-slot';
import CellMode from './cell-mode';
import makeTag from './make-tag';

var h = virtualDom.h;

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

export class SmartGrid {
  constructor(def) {
    this.def = def;
    this.analyzer = new Analyzer(def);
    this.dataSlotManager = new DataSlotManager(this.analyzer);
    var sg = this;
    this.$$view = $$(h('.smart-grid', h('.grid-container', {
        hook: new class Hook {
          hook(node) {
            sg.gridContainerEl = node;
          }
        },
    }, [
      h('.grid', [
        h('.top-tag-row', [
          h('.v-h-header'), 
          h('.header', 'A')
        ]),
        h('.row', h('.header', '1'))
      ])
    ])), 'view');
    this.gridContainerEl = null;
    this.$$actualWidth = $$(0, 'actual-width');
    this.$$actualHeight = $$(0, 'actual-height');
    this.$$viewportWidth = $$(0, 'viewport-width');
    this.$$viewportHeight = $$(0, 'viewport-height');
    this.$$left = $$(0, 'left');
    this.$$top = $$(0, 'top');
    let topmostRowVf = function ([top, actualHeight]) {
      if (!actualHeight) return 0;
      return Math.floor(top * actualHeight / sg.cellHeight); 
    };
    this.$$topmostRow = $$.connect(
      [this.$$top, this.$$actualHeight], topmostRowVf, 
      'topmost', 
      function (oldVal, newVal) { 
        return oldVal != newVal; 
      }
    );
    this.$$leftmostCol = $$.connect([this.$$left, this.$$actualWidth], function ([top, actualWidth]) {
      if (!actualWidth) return 0;
      return Math.floor(top * actualWidth / sg.cellWidth); 
    }, 'leftmost', function (oldVal, newVal) { return oldVal != newVal; });
    this.$$focusedCell = $$(null, 'focused-cell');
  }
  setupLayout() {
    let vHeader = this.gridContainerEl.querySelector('.row .header');
    let hHeader = this.gridContainerEl.querySelector('.top-tag-row .header');
    this.vHeaderWidth = vHeader.offsetWidth;
    this.hHeaderHeight = hHeader.offsetHeight;
    this.cellWidth = hHeader.offsetWidth;
    this.cellHeight = vHeader.offsetHeight;
    var viewportWidth = this.gridContainerEl.offsetWidth - this.vHeaderWidth;
    var viewportHeight = this.gridContainerEl.offsetHeight - this.hHeaderHeight;
    this.rowNum = Math.floor((viewportHeight - 1) / this.cellHeight) + 1;
    this.colNum = Math.floor((viewportWidth - 1) / this.cellWidth) + 1;
    $$.update(
      [this.$$viewportWidth, viewportWidth],
      [this.$$viewportHeight, viewportHeight],
      [this.$$actualWidth, 2 * viewportWidth],
      [this.$$actualHeight, 2 * viewportHeight]
    );
    this.$$activeSheetIdx = $$(0, 'active-tab');
    let sheetNames = [];
    for (var {label} of this.analyzer.sheets) {
      sheetNames.push(label);
    }
    this.$$activeSheetIdx.change(function (sg, sheetNames) {
      return function (activeSheetIdx) {
        sg.cells = range(0, sg.rowNum).map(function (row) {
          return range(0, sg.colNum).map(function (col) {
            return new Cell(sg, activeSheetIdx, row, col);
          });
        });
        let vf = function ([vScrollbar, hScrollbar, grid]) {
          return h('.smart-grid', [
            grid,
            hScrollbar,
            vScrollbar,
            h('.tabs', sheetNames.map(function (tn, idx) {
              return h('a' + (idx == activeSheetIdx? '.active': ''), {
                href: '#',
                onclick() {
                  if (idx != activeSheetIdx) {
                    sg.$$activeSheetIdx.val(idx);
                  }
                  return false;
                }
              }, tn);
            }))
          ]);
        };
        sg.$$view.connect([
          sg.$$createVScrollbar(), sg.$$createHScrollbar(),
          sg.$$createGrid()
        ], vf).update();
      };
    }(this, sheetNames)).update();
  }
  $$createTopTagRow() {
    var sg = this;
    var $$topTagCells = range(0, this.colNum).map(function (idx) {
      return $$.connect(
        [sg.$$leftmostCol, sg.$$focusedCell], 
        function ([leftmostCol, focusedCell]) {
          let classNames = '.header';
          if (focusedCell && focusedCell.col === idx + leftmostCol) {
            classNames += '.focused';
          }
          return h(classNames, 
                   toColumnIdx(Number(leftmostCol) + idx));
        });
    });
    return $$.connect($$topTagCells, function (cells) {
      return h('.top-tag-row', [h('.v-h-header')].concat(cells));      
    });
  }
  makeLeftTagHeaderSlot(row) {
    return $$.connect([this.$$topmostRow, this.$$focusedCell], function ([topmostRow, focusedCell]) {
      let classNames = '.header';
      if (focusedCell && row + topmostRow == focusedCell.row) {
        classNames += '.focused';
      }
      return h(classNames, '' + (topmostRow + row + 1));
    });
  }
  getCellSlot(sheetIdx, tag) {
    return this.dataSlotManager.get(sheetIdx, tag);
  }
  createCellSlot(sheetIdx, tag) {
    return this.dataSlotManager.create(sheetIdx, tag);
  }
  getCellDef(sheetIdx, tag) {
    return this.analyzer.getCellDef(sheetIdx, tag);
  }
  setCellDef(sheetIdx, tag, def) {
    return this.analyzer.setCellDef(sheetIdx, tag, def);
  }
  $$createCell(row, col) {
    let sg = this;
    let vf = function ([leftmostCol, topmostRow, data], initiators) {
      let tag = makeTag(row + topmostRow, col + leftmostCol);
      let cellDef = sg.analyzer.getCellDef(sg.$$activeSheetIdx.val(), tag);
      if (initiators) {
        let leftChanged = ~initiators.indexOf(sg.$$leftmostCol);
        let topChanged = ~initiators.indexOf(sg.$$topmostRow);
        if (leftChanged || topChanged) {
          let $$cellData = sg.dataSlotManager.get(sg.$$activeSheetIdx.val(), tag);
          if ($$cellData) {
            $$data.connect([$$cellData], ([it]) => it);
          } else {
            $$data.connect([], () => cellDef? cellDef.val: '');
          }
          data = $$data.val();
        }
      }
      return h('.cell', data);
    };
    let $$data;
    let tag = makeTag(row, col);
    let $$cellData = this.dataSlotManager.get(this.$$activeSheetIdx.val(), tag);
    if ($$cellData) {
      $$data = $$.connect([$$cellData], function ([it]) {
        return it;
      }, 'cell-data-${tag}');
    } else {
      let cellDef = this.analyzer.getCellDef(this.$$activeSheetIdx.val(), tag);
      $$data = $$(cellDef? cellDef.val: '', 'cell-data-${tag}');
    }
    return pipeSlot(null, 'cell-{tag}').connect([this.$$leftmostCol, this.$$topmostRow, $$data], vf);
  }
  $$createRow(row) {
    let sg = this;
    return $$.connect([sg.makeLeftTagHeaderSlot(row)].concat(this.cells[row].map(c => c.$$view)), function ([leftTagHeader, ...cells]) {
      return h('.row', [leftTagHeader].concat(cells));
    });
  }
  $$createDataGrid() {
    var sg = this;
    return $$.connect(range(0, sg.rowNum).map(function (row) {
      return sg.$$createRow(row);
    }), function (rows) {
      return [rows];
    });
  }
  $$createGrid() {
    let smartGrid = this;
    let vf = function ([topTagRow, dataGrid]) {
      return h('.grid-container', [
        h('.grid', {
          onwheel(e) {
            let actualHeight = smartGrid.$$actualHeight.val();
            let viewportHeight = smartGrid.$$viewportHeight.val();
            var top = (smartGrid.$$top.val() * actualHeight + e.deltaY / 2) / actualHeight;
            if (top < 0) {
              top = 0;
            }
            if (top * actualHeight + viewportHeight >= actualHeight) {
              let scrolledHeight = actualHeight - viewportHeight;
              actualHeight += viewportHeight;
              top = scrolledHeight / actualHeight;
              smartGrid.$$actualHeight.val(actualHeight);
            }
            smartGrid.$$top.val(top);
          }
        }, [
          topTagRow,
          dataGrid,
        ])
      ]);
    };
    return $$.connect(
      [this.$$createTopTagRow(), this.$$createDataGrid()], 
      vf);
  }
  $$createHScrollbar() {
    let $$dragging = $$(false, 'dragging');
    let railEl;
    let barEl;
    let smartGrid = this;
    let vf = function ([viewportWidth, actualWidth, dragging, left]) {
      return h('.scrollbar.horizontal' + (dragging? '.dragging': ''), {
        hook: new class Hook {
          hook(el) {
            railEl = el;
            barEl = el.getElementsByClassName('bar')[0];
          }
        },
      }, [
        h('.bar', {
          style: {
            width: (viewportWidth / actualWidth) * 100 + '%',
            left: left * 100  + '%',
          }, 
          // note, this function won't be recreated, so 
          // it always remembers the first "left" etc.
          onmousedown(e) {
            $$dragging.toggle();
            let lastX = e.clientX;
            let onmouseup = function () {
              $$dragging.toggle();
              document.removeEventListener('mouseup', onmouseup);
              document.removeEventListener('mousemove', onmousemove);
            };
            document.addEventListener('mouseup', onmouseup);
            let onmousemove = function (e) {
              // why prevent default? otherwise onmouseup is missed, http://stackoverflow.com/questions/9776086/how-to-disable-drag-drop-functionality-in-chrome
              e.preventDefault();
              let railWidth = railEl.offsetWidth;
              let barWidth = barEl.offsetWidth;
              left = (left * railWidth + (e.clientX - lastX)) / railWidth;
              if (left < 0) {
                left = 0;
              }
              let updates = [];
              // met the end
              if (left * railWidth + barWidth >= railWidth) {
                let scrolledWidth = actualWidth - viewportWidth;
                actualWidth += viewportWidth;
                left = scrolledWidth / actualWidth;
                updates.push([smartGrid.$$actualWidth, actualWidth]);
              }
              lastX = e.clientX;
              updates.push([smartGrid.$$left, left]);
              $$.update(...updates);
            };
            document.addEventListener('mousemove', onmousemove);
          },
        }),
      ]);
    };
    return $$.connect(
      [this.$$viewportWidth, this.$$actualWidth, $$dragging, this.$$left], 
      vf);
  }
  $$createVScrollbar() {
    let $$dragging = $$(false, 'dragging');
    let railEl;
    let barEl;
    var smartGrid = this;
    let vf = function ([viewportHeight, actualHeight, dragging, top]) {
      let classNames = '.scrollbar.vertical';
      if (dragging) {
        classNames += '.dragging';
      }
      return h(classNames, {
        hook: new class Hook {
          hook(node) {
            railEl = node;
            barEl = railEl.getElementsByClassName('bar')[0];
          }
        }
      }, [
        h('.bar', {
          style: {
            height: (viewportHeight / actualHeight) * 100 + '%',
            top: top * 100 + '%',
          },
          onmousedown(e) {
            $$dragging.toggle();
            let lastY = e.clientY;
            let onmouseup = function () {
              $$dragging.toggle();
              document.removeEventListener('mouseup', onmouseup);
              document.removeEventListener('mousemove', onmousemove);
            };
            let onmousemove = function (e) {
              // why prevent default? otherwise onmouseup is missed, http://stackoverflow.com/questions/9776086/how-to-disable-drag-drop-functionality-in-chrome
              e.preventDefault();
              let railHeight = railEl.offsetHeight;
              let barHeight = barEl.offsetHeight;
              top = (top * railHeight + e.clientY - lastY) / railHeight;
              if (top < 0) {
                top = 0;
              }
              let updates = [];

              if (top * railHeight + barHeight >= railHeight) {
                let scrolledHeight = actualHeight - viewportHeight;
                actualHeight += viewportHeight;
                top = scrolledHeight / actualHeight;
                updates.push([smartGrid.$$actualHeight, actualHeight]);
              }
              updates.push([smartGrid.$$top, top]);
              lastY = e.clientY;
              $$.update(...updates);
            };
            document.addEventListener('mouseup', onmouseup);
            document.addEventListener('mousemove', onmousemove);
          }
        }),
      ]);
    };
    return $$.connect(
      [this.$$viewportHeight, this.$$actualHeight, $$dragging, this.$$top], 
      vf);
  }
  moveLeft() {
    var focusedCell = this.$$focusedCell.val();
    if (focusedCell) {
      if (focusedCell.mode === CellMode.SELECTED) {
        this.select(focusedCell.row, focusedCell.col - 1);
      }
    } else {
      this.select(0, 0);
    }
  }
  moveUp() {
    var focusedCell = this.$$focusedCell.val();
    if (focusedCell) {
      if (focusedCell.mode === CellMode.SELECTED) {
        this.select(focusedCell.row - 1, focusedCell.col);
      }
    } else {
      this.select(0, 0);
    }
  }
  moveRight() {
    var focusedCell = this.$$focusedCell.val();
    if (focusedCell) {
      if (focusedCell.mode === CellMode.SELECTED) {
        this.select(focusedCell.row, focusedCell.col + 1);
      }
    } else {
      this.select(0, 0);
    }
  }
  moveDown() {
    var focusedCell = this.$$focusedCell.val();
    if (focusedCell) {
      if (focusedCell.mode === CellMode.SELECTED) {
        this.select(focusedCell.row + 1, focusedCell.col);
      }
    } else {
      this.select(0, 0);
    }
  }
  select(row, col) {
    let updates = [
      [this.$$focusedCell, {
        row,
        col,
        tag: makeTag(row, col),
        mode: CellMode.SELECTED,
      }],
    ];
    if (row < 0 || col < 0) {
      return;
    }
    // make sure this focused cell in the viewport
    let leftmostCol = this.$$leftmostCol.val();
    let topmostRow = this.$$topmostRow.val();
    let left = null;
    let top = null;
    // under the viewport, since the last row may cross the right 
    // boundary of viewport, we test the second last row, same to 
    // the last column
    if (row >= topmostRow + this.rowNum - 3) {
      top = (row - this.rowNum + 3) * this.cellHeight;
    }
    // above the viewport
    if (row < topmostRow) {
      top = row * this.cellHeight;
    }
    // on the right of viewport
    if (col >= leftmostCol + this.colNum - 3) {
      left = (col - this.colNum + 3) * this.cellWidth;
    }
    // on the left of viewport
    if (col < leftmostCol) {
      left = col * this.cellWidth;
    }
    
    left != null && updates.push([this.$$left, left / this.$$actualWidth.val()]);
    top != null && updates.push([this.$$top, top / this.$$actualHeight.val()]);
    $$.update(...updates);
  }
  edit(row, col) {
    if (row === undefined || col === undefined) {
      var focusedCell = this.$$focusedCell.val();
      if (focusedCell) {
        return this.edit(focusedCell.row, focusedCell.col);
      }
      return false;
    }
    if (this.getCellDef(makeTag(row, col)).readOnly) {
      return false;
    }
    let args = [
      [this.$$focusedCell, {
        row, 
        col,
        tag: makeTag(row, col),
        mode: CellMode.EDIT,
      }],
    ];
    $$.update(...args);
    return true;
  }
};

SmartGrid.prototype.onUpdated = function () {
  let focusedCell = this.$$focusedCell.val();
  if (focusedCell && focusedCell.mode == CellMode.EDIT) {
    let {row, col} = focusedCell;
    row -= this.$$topmostRow.val();
    if (row >= 0) {
      col -= this.$$leftmostCol.val();
      focusedCell = this.cells[row][col];
      focusedCell && focusedCell.el.getElementsByTagName('input')[0].focus();
    }
  }
};

const LEFT = 37;
const UP = 38;
const RIGHT = 39;
const DOWN = 40;

SmartGrid.prototype.registerShortcus = function () {
  let sg = this;
  document.addEventListener('keydown', function (e) {
    let m = sg[{
      [LEFT]: 'moveLeft',
      [UP]: 'moveUp',
      [RIGHT]: 'moveRight',
      [DOWN]: 'moveDown',
    }[e.keyCode]];
    m && m.apply(sg);
    if (e.keyCode == 27 || e.keyCode == 13) {
      sg.edit();
    }
  });
};

const range = function (start, end) {
  var a = Array(end - start);
  for (var i = start; i < end; ++i) {
    a[i - start] = i;
  }
  return a;
};

export default SmartGrid;
