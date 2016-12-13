import $$ from 'slot';
import Analyzer from './analyzer';
import DataSlotManager from './data-slot-manager';
import Cell from './cell';
import virtualDom from 'virtual-dom';
import CellMode from './cell-mode';
import makeTag from './make-tag';

var h = virtualDom.h;

/**
 * change to column index notation, this notation is very bizzare, for example:
 * 0 -> A  // assume A denotes 0
 * ...
 * 25 -> Z
 * but, 26, which is '10' as 26-based integer, converted to 'AA'
 * (which should be 'BA' if we assume B denotes 1),
 * so the most significant digit should be minus one.
 * This flow shows how 26 is changed to 'AA'
 * 26 -> 10 -> BA -> AA
 * */
var toColumnIdx = function (idx) {
  var columnIdx = Number(idx).toString(26).split('').map(
    c => parseInt(c, 26) + 'A'.charCodeAt(0)
  );
  if (columnIdx.length > 1) {
    --columnIdx[0];
  }
  return columnIdx.map(i => String.fromCharCode(i)).join('');
};


export class SmartGrid {
  /**
   * @constructor
   *
   * to seperate css with js, smart grid use '2 way mount' to generate
   * the vdom, for the first way, it only creates a top row header and a
   * left column header to get their height and width (only after mounted to
   * the real dom tree), and computes how many
   * cells should be used to occupy the whole available spaces, note, it won't
   * create as many cells as the grid's definition required (which is actually
   * unacceptable slow).
   *
   * then after it is mounted to dom tree, the client should call 'setupLayout'
   * to generate the second way vdom
   * */
  constructor(def) {
    this.def = def;
    this.analyzer = new Analyzer(def);
    this.dataSlotManager = new DataSlotManager(this.analyzer);
    var sg = this;
    this.$$view = $$(h('.smart-grid', [
      h('.editor', [
        h('label', 'fx'),
        h('input')
      ]),
      h('.grid-container', {
        hook: new class Hook {
          hook(node) {
            sg.gridContainerEl = node;
            setTimeout(function () {
              sg.setupLayout();
              sg.registerShortcus();
            }, 0);
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
      ])
    ]), 'view');
    this.gridContainerEl = null;
    this.$$actualWidth = $$(0, 'actual-width');
    this.$$actualHeight = $$(0, 'actual-height');
    this.$$viewportWidth = $$(0, 'viewport-width');
    this.$$viewportHeight = $$(0, 'viewport-height');
    this.$$left = $$(0, 'left');
    this.$$top = $$(0, 'top');
    this.$$activeSheetIdx = $$(0, 'active-tab');
    let topmostRowVf = function ([top, actualHeight]) {
      if (!actualHeight) return 0;
      return Math.floor(top * actualHeight / sg.cellHeight);
    };
    this.$$topmostRow = $$.connect(
      [this.$$top, this.$$actualHeight],
      topmostRowVf,
      'topmost',
      function (oldVal, newVal) {
        return oldVal != newVal;
      }
    );
    let leftmostColVf = function ([left, actualWidth]) {
      if (!actualWidth) return 0;
      return Math.floor(left * actualWidth / sg.cellWidth);
    };
    this.$$leftmostCol = $$.connect(
      [this.$$left, this.$$actualWidth],
      leftmostColVf,
      'leftmost',
      function (oldVal, newVal) {
        return oldVal != newVal;
      }
    );
    let onScreenScroll = function (sg) {
      return function () {
        let $$views = [];
        for (let row of sg.cells) {
          for (let cell of row) {
            cell.resetView(sg.$$topmostRow.val(), sg.$$leftmostCol.val());
            $$views.push([cell.$$view]);
          }
        }
        // force update cells (remember resetView won't update)
        $$.update.apply(null, $$views);
      };
    }(this);
    this.$$topmostRow.change(onScreenScroll);
    this.$$leftmostCol.change(onScreenScroll);
    this.$$activeSheetIdx.change(function (sg) {
      return function () {
        $$.update(
          [sg.$$leftmostCol, 0],
          [sg.$$topmostRow, 0]
        );
        onScreenScroll();
      };
    }(this));
    this.$$focusedCell = $$.connect(
      [this.$$activeSheetIdx],
      function () {
        return null;
      }, 'focused-cell'
    );
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
    this.cells = function (sg) {
      return range(0, sg.rowNum).map(function (row) {
        return range(0, sg.colNum).map(function (col) {
          return new Cell(sg, row, col);
        });
      });
    }(this);
    $$.update(
      [this.$$viewportWidth, viewportWidth],
      [this.$$viewportHeight, viewportHeight],
      [this.$$actualWidth, 2 * viewportWidth],
      [this.$$actualHeight, 2 * viewportHeight]
    );
    let sheetNames = [];
    for (var {label} of this.analyzer.sheets) {
      sheetNames.push(label);
    }
    let vf = function ($$activeSheetIdx) {
      return function ([activeSheetIdx, vScrollbar, hScrollbar, editor, grid]) {
        return h('.smart-grid', [
          editor,
          grid,
          hScrollbar,
          vScrollbar,
          h('.tabs', sheetNames.map(function (tn, idx) {
            return h('a' + (idx == activeSheetIdx? '.active': ''), {
              href: '#',
              onclick() {
                if (idx != activeSheetIdx) {
                  $$activeSheetIdx.val(idx);
                }
                return false;
              }
            }, tn);
          }))
        ]);
      };
    }(this.$$activeSheetIdx);
    this.$$view.connect([
      this.$$activeSheetIdx,
      this.$$createVScrollbar(), this.$$createHScrollbar(),
      this.$$createEditor(),
      this.$$createGrid()
    ], vf).update();
  }
  $$createEditor() {
    let sg = this;
    return $$.connect(
      [sg.$$focusedCell],
      function ([focusedCell]) {
        let def = focusedCell? sg.getCellDef(focusedCell.tag): null;
        return h('.editor', [
          h('label', [
            def && def.readonly? h('i.fa.fa-lock'): void 0,
            'fx',
          ]),
          h('input', {
            value: def? def.val: '',
            disabled: def && def.readonly,
            title: def? def.val: '',
            onkeydown(e) {
              if (~[UP, RIGHT, DOWN, LEFT].indexOf(e.keyCode)) {
                e.stopPropagation();
                return;
              }
              if (e.keyCode == 27 || e.keyCode == 13) {
                e.stopPropagation();
                let { row, col } = focusedCell;
                let cell = sg.cells[row][col];
                cell.editorHook.onChangeCb(cell, this.value);
                return false;
              }
            }
          })
        ]);
      }
    );
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
    return $$.connect(
      [this.$$topmostRow, this.$$focusedCell],
      function ([topmostRow, focusedCell]) {
        let classNames = '.header';
        if (focusedCell && row + topmostRow == focusedCell.row) {
          classNames += '.focused';
        }
        return h(classNames, '' + (topmostRow + row + 1));
      }
    );
  }
  searchCells(test) {
    return this.analyzer.searchCells(test);
  }
  getCellSlot(tag, sheetIdx) {
    if (sheetIdx === void 0) {
      sheetIdx = this.$$activeSheetIdx.val();
    }
    return this.dataSlotManager.get(sheetIdx, tag);
  }
  createCellSlot(sheetIdx, tag) {
    return this.dataSlotManager.create(sheetIdx, tag);
  }
  getTagByLabel(sheetIdx, label) {
    return this.analyzer.getTagByLabel(sheetIdx, label);
  }
  getCellDef(tag, sheetIdx) {
    if (sheetIdx === void 0) {
      sheetIdx = this.$$activeSheetIdx.val();
    }
    return this.analyzer.getCellDef(sheetIdx, tag);
  }
  setCellDef(tag, def, sheetIdx) {
    if (sheetIdx === void 0) {
      sheetIdx = this.$$activeSheetIdx.val();
    }
    return this.analyzer.setCellDef(sheetIdx, tag, def);
  }
  getCellValue(tag, sheetIdx) {
    if (sheetIdx === void 0) {
      sheetIdx = this.$$activeSheetIdx.val();
    }
    let $$slot = this.getCellSlot(tag, sheetIdx);
    if ($$slot) {
      return $$slot.val();
    }
    let def = this.getCellDef(tag, sheetIdx);
    return def? def.val: '' ;
  }
  $$createRow(row) {
    let sg = this;
    return $$.connect(
      [sg.makeLeftTagHeaderSlot(row)].concat(
        this.cells[row].map(c => c.$$view)),
      function ([leftTagHeader, ...cells]) {
        return h('.row', [leftTagHeader].concat(cells));
      }, `row-${row}`
    );
  }
  $$createDataGrid() {
    var sg = this;
    return $$.connect(range(0, sg.rowNum).map(function (row) {
      return sg.$$createRow(row);
    }), function (rows) {
      return [rows];
    }, 'data-grid');
  }
  $$createGrid() {
    let smartGrid = this;
    let vf = function ([topTagRow, dataGrid]) {
      return [
        h('.grid-container', [
          h('.grid', {
            onwheel(e) {
              let actualHeight = smartGrid.$$actualHeight.val();
              let viewportHeight = smartGrid.$$viewportHeight.val();
              let top = (
                (smartGrid.$$top.val() * actualHeight + e.deltaY / 2)
                / actualHeight
              );
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
        ])
      ];
    };
    return $$.connect(
      [this.$$createTopTagRow(), this.$$createDataGrid()],
      vf, 'grid');
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
              /* eslint-disable max-len */
              // why prevent default? otherwise onmouseup is missed,
              // http://stackoverflow.com/questions/9776086/how-to-disable-drag-drop-functionality-in-chrome
              /* eslint-enable max-len */
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
      vf, 'horizontal-scrollbar');
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
              /* eslint-disable max-len */
              // why prevent default? otherwise onmouseup is missed,
              // http://stackoverflow.com/questions/9776086/how-to-disable-drag-drop-functionality-in-chrome
              /* eslint-enable max-len */
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
      vf, 'vertical-scrollbar');
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
  /**
   * focus in a given position
   * */
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

    left != null && updates.push(
      [this.$$left, left / this.$$actualWidth.val()]
    );
    top != null && updates.push([this.$$top, top / this.$$actualHeight.val()]);
    $$.update(...updates);
  }
  /**
   * edit a given position
   * */
  edit(row, col) {
    if (row === void 0 || col === void 0) {
      var focusedCell = this.$$focusedCell.val();
      if (focusedCell) {
        return this.edit(focusedCell.row, focusedCell.col);
      }
      return false;
    }
    if (this.getCellDef(makeTag(row, col)).readOnly) {
      return false;
    }
    this.$$focusedCell.val({
      row,
      col,
      tag: makeTag(row, col),
      mode: CellMode.EDIT,
    });
    return true;
  }
  onUpdated() {
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
  }
  getRawCellDef(cellDef) {
    let ret = {};
    for (let k in cellDef) {
      if (!k.startsWith('__')) {
        ret[k] = cellDef[k];
      }
    }
    return ret;
  }
}

const LEFT = 37;
const UP = 38;
const RIGHT = 39;
const DOWN = 40;

/**
 * invoke this method if you want support up/down/left/right keyboard shortcuts
 * */
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

/**
 * a range function like the counterpart in python
 * */
const range = function (start, end) {
  var a = Array(end - start);
  for (var i = start; i < end; ++i) {
    a[i - start] = i;
  }
  return a;
};

export default {
  SmartGrid,
  toColumnIdx,
};
