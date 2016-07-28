import { $$loading, $$chargeBillDef } from './data-slots.js';
import x from '../xx.js';
import SmartGrid from '../smart-grid/smart-grid.js';
var h = virtualDom.h;

const valueFunc = function (loading, chargeBillDef) {
  return h('.ui.grid.container',     
             h('.row',     
               h('.column', new SmartGrid(chargeBillDef).vnode)
              )
          ); 
};

export const $$page = x.connect([$$loading, $$chargeBillDef], 
                                valueFunc, 'page');

$$page.change(function () {
  var container = document.getElementById('main');
  var oldVnode = $$page.val();
  var rootNode = virtualDom.create(oldVnode);
  container.appendChild(rootNode);
  return function (vnode) {
    rootNode = virtualDom.patch(rootNode, virtualDom.diff(oldVnode, vnode));
  };
}());
