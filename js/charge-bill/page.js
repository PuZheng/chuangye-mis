import { $$loading, $$chargeBill } from './data-slots.js';
import x from '../xx.js';
import SmartGrid from '../../smart-grid/smart-grid.js';
var h = virtualDom.h;

const mount = function () {
  var container = document.getElementById('main');
  return function (slot) {
    var oldVnode = slot.val();
    var rootNode = virtualDom.create(oldVnode);
    container.innerHTML = "";
    container.appendChild(rootNode);
    slot.change(function (vnode) {
      rootNode = virtualDom.patch(rootNode, virtualDom.diff(oldVnode, vnode));
      oldVnode = vnode;
      SmartGrid.didMount.apply($$smartGrid, [rootNode]);
    });
  };
}();

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

var $$page = x.connect([$$loading], valueFunc, 'page');
mount($$page);
var $$smartGrid;

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
  mount($$page);
  $$page.refresh();
});
