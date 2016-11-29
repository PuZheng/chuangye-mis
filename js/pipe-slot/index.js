import $$ from 'slot';

var objectValues = function objectValues(obj) {
  if (Object.values && typeof Object.values === 'function') {
    return Object.values(obj);
  }
  let values = [];
  for (let k in obj){
    if (obj.hasOwnProperty(k)) {
      values.push(obj[k]);
    }
  }
  return values;
};

var PipeSlot = function PipeSlot(...args) {
  $$.Slot.apply(this, args);
  this.children = new Proxy(this.children, {
    set(target, prop, value) {
      if (!(prop in target) && objectValues(target).length > 0) {
        throw new Error('pipe slot only accepts one child');
      }
      target[prop] = value;
      return true;
    }
  });
};

PipeSlot.prototype = Object.create($$.Slot.prototype);


export default (function (p) {
  p.Slot = PipeSlot;
  p.slot = function (...args) {
    return new PipeSlot(args);
  };
  return p;
})((initial, tag, changed) => new PipeSlot(initial, tag, changed));
