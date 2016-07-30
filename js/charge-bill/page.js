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
  return h('.ui.grid.container',     
             h('.row',     
               h('.column', smartGrid)
              )
          ); 
};

var $$page = x.connect([$$loading], valueFunc, 'page');
mount($$page);
var $$smartGrid;

$$chargeBill.change(function ({def, data}) {
  $$smartGrid = new SmartGrid(def, data).$$view;
  $$page = x.connect([$$loading, $$smartGrid], 
                         valueFunc, 'page');
  mount($$page);
  $$page.refresh();
});
