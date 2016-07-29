import { $$loading } from './data-slots.js';
import x from '../xx.js';
import smartGrid from '../../smart-grid/smart-grid.js';
var h = virtualDom.h;

const valueFunc = function (loading, chargeBillDef, chargeBillData, smartGrid) {
  return h('.ui.grid.container',     
             h('.row',     
               h('.column', smartGrid)
              )
          ); 
};

export const $$chargeBillDef = smartGrid.$$def;
export const $$chargeBillData = smartGrid.$$data;
export const $$page = x.connect([$$loading, $$chargeBillDef, $$chargeBillData, smartGrid.$$view], 
                                valueFunc, 'page');

$$page.change(function () {
  var container = document.getElementById('main');
  var oldVnode = $$page.val();
  var rootNode = virtualDom.create(oldVnode);
  container.appendChild(rootNode);
  return function (vnode) {
    rootNode = virtualDom.patch(rootNode, virtualDom.diff(oldVnode, vnode));
    oldVnode = vnode;
    smartGrid.didMount.apply(smartGrid, [rootNode]);
  };
}());

