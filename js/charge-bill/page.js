import { $$loading, $$chargeBill } from './data-slots.js';
import x from '../xx.js';
import SmartGrid from '../../smart-grid/smart-grid.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

const valueFunc = function (loading, smartGrid) {
  return h('.ui.grid.container', [
    h('.row', [
      h('.sixteen.wide.column', h('h2', '2016-08电费单')),
      h('.sixteen.wide.column', smartGrid),
      h('.sixteen.wide.column', [
        h('p', {
          style: {
            padding: '1em 0',
            color: 'grey',
          }
        }, '* 上下左右移动，双击鼠标或输入回车键进行编辑，回车键结束编辑')
      ]),
    ]),
    h('.right.aligned.row', 
      h('.column', [
        h('.ui.tiny.buttons', [
          h('.ui.tiny.primary.button', '保存'),
          h('.ui.tiny.red.button', '生成预扣费记录'),
        ]),
      ])
     )
  ]);    
};

var $$smartGrid;
export var $$page = x.connect([$$loading], valueFunc, 'page');

var keydown;
$$chargeBill.change(function ({def, data}) {
  let smartGrid = new SmartGrid(def, data);
  $$smartGrid = smartGrid.$$view;
  $$page = x.connect([$$loading, $$smartGrid], 
                         valueFunc, 'page');
  keydown = function (smartGrid) {
    return function keydown(e) {
      let m = smartGrid[{
        37: 'moveLeft',
        38: 'moveUp',
        39: 'moveRight',
        40: 'moveDown',
      }[e.keyCode]];
      m && m.apply(smartGrid);
      if (e.keyCode == 27 || e.keyCode == 13) {
        smartGrid.edit();
      }
      return false;
    };
  }(smartGrid);
  if (keydown) {
    document.removeEventListener('keydown', keydown, false);
  }
  document.addEventListener('keydown', keydown, false);
  mount($$page, function (rootNode) {
    SmartGrid.didMount.apply($$smartGrid, [rootNode]);
  });
  $$page.refresh();
});
