import virtualDom from 'virtual-dom';
var create = virtualDom.create;
var patch = virtualDom.patch;
var diff = virtualDom.diff;

var container = document.getElementById('main');
var lastMountable;
var onChange;

export var mount = function (mountable) {
  var oldVnode = mountable.$$view.val();
  var rootNode = create(oldVnode);
  container.innerHTML = "";
  container.appendChild(rootNode);
  if (lastMountable) {
    lastMountable.$$view.offChange(onChange);
    lastMountable.onUnmount && lastMountable.onUnmount.apply(this, [rootNode]);
  }
  onChange = function (vnode) {
    rootNode = patch(rootNode, diff(oldVnode, vnode));
    oldVnode = vnode;
    mountable.onUpdated && mountable.onUpdated.apply(this, [rootNode]);
  };
  mountable.$$view.change(onChange);
  mountable.onMount && mountable.onMount.apply(this, [rootNode]);
  lastMountable = mountable;
};

export default mount;
