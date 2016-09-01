import virtualDom from 'virtual-dom';
var h = virtualDom.h;
class Cell {
  constructor(value) {
    this.value = value;
  }
  get vnode() {
    return h('.cell', this.value);
  }
};

export default Cell;
