import virtualDom from 'virtual-dom';
var create = virtualDom.create;
var patch = virtualDom.patch;
var diff = virtualDom.diff;

var container = document.getElementById('main');
var oldSlot;
var onChange;

export var mount = function (slot, cb) {
  var oldVnode = slot.val();
  var rootNode = create(oldVnode);
  container.innerHTML = "";
  container.appendChild(rootNode);
  if (oldSlot) {
    oldSlot.offChange(onChange);
  }
  onChange = function (vnode) {
    rootNode = patch(rootNode, diff(oldVnode, vnode));
    oldVnode = vnode;
    cb && cb(rootNode);
  };
  slot.change(onChange);
  oldSlot = slot;
};

export default mount;
