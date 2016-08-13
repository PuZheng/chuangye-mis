import virtualDom from 'virtual-dom';
var create = virtualDom.create;
var patch = virtualDom.patch;
var diff = virtualDom.diff;

var lastMountableMap = {};

var uniqueId = function () {
  let id = 1;
  return function () {
    return '' + id++;
  };
}();

/**
 * mount a MOUTABLE to dom tree, and unmount the previously mounted mountable
 * @param {object} mountable - a mountable has the following properties:
 *
 *   * $$view - a slot that holds a virtual dom (that is what to be patched into dom)
 *   * onMount(rootNode) - a function will be called when mountable mount
 *   * onUpdated(rootNode) - a function will be called when $$view change
 *   * onUnmount(rootNode) - a function will be called when mountable unmount(this happends when other mountable mount)
 *  @param {string|dom} container
 * */
export var mount = function (mountable, container='#main') {
  var oldVnode = mountable.$$view.val();
  var rootNode = create(oldVnode);
  if (typeof container === 'string') {
    container = document.querySelector(container);
  }
  if (!container.getAttribute('data-mount-id')) {
    container.setAttribute('data-mount-id', uniqueId());
  }
  let mountId = container.getAttribute('data-mount-id');
  container.innerHTML = "";
  container.appendChild(rootNode);
  unmount(mountId, rootNode);
  let onChange = function (vnode) {
    rootNode = patch(rootNode, diff(oldVnode, vnode));
    oldVnode = vnode;
    mountable.onUpdated && mountable.onUpdated.apply(this, [rootNode]);
  };
  mountable.$$view.change(onChange);
  mountable.onMount && mountable.onMount.apply(this, [rootNode]);
  lastMountableMap[mountId] = {
    mountable,
    onChange,
  };
};

/**
 * unmount what mounted to container
 * */
var unmount = function (mountId, rootNode) {
  let {mountable, onChange} = lastMountableMap[mountId] || {};
  if (mountable) {
    mountable.$$view.offChange(onChange);
    mountable.onUnmount && mountable.onUnmount.apply(this, [rootNode]);
  }
};

export default mount;
