import virtualDom from 'virtual-dom';
var create = virtualDom.create;
var patch = virtualDom.patch;
var diff = virtualDom.diff;

var container = document.getElementById('main');
var lastMountable;
var onChange;

/**
 * mount a MOUTABLE to dom tree, and unmount the previously mounted mountable
 *  
 *  * data
 *  @param {object} mountable - a mountable has the following properties:
 *
 *   * $$view - a slot that holds a virtual dom (that is what to be patched into dom)
 *   * onMount(rootNode) - a function will be called when mountable mount
 *   * onUpdated(rootNode) - a function will be called when $$view change
 *   * onUnmount(rootNode) - a function will be called when mountable unmount(this happends when other mountable mount)
 * */
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
