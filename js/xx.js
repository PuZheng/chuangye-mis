var uniqueId = function () {
  var i = 1;
  return function () {
    return i++;
  };
}();

var makeSlot = function (tag, initial) {
  return function (p) {
    p.name = tag;
    p.__tag = tag;
    p.value = initial;
    p.cbs = [];
    p.onChangeCbs = [];
    p.change = function (onChange) {
      p.onChangeCbs.push(onChange);
    };
    p.children = [];
    p.__id = uniqueId();
    p.bind(p);
    p.tag = function (tag) {
      p.name = tag;
      p.__tag = tag;
      return p;
    };
    return p;
  }(function (newValue) {
    if (newValue === undefined) {
      return this.value;
    } else {
      var oldValue = this.value;
      this.value = newValue; 
      this.onChangeCbs.forEach(function (cb) {
        cb(newValue);
      });
      this.cbs.forEach(function (cb) {
        cb(newValue);
      });
      return oldValue;
    }
  });
};

var connect = function () {
  var args = [...arguments];
  var ret = makeSlot();
  var computeValue = args[args.length - 1];
  var slots = args.slice(0, args.length - 1);
  slots.forEach(function (slot, i) {
    slot.cbs.push(function (v) {
      ret.apply(ret, [computeValue(...slots.map((slot_, j) => (i === j)? v: slot_.apply(slot_)))]);
    });
    slot.children.push(ret);
  });
  ret.refresh = function () {
    this.apply(this, [computeValue(...slots.map((slot) => slot.apply(slot)))]);
  };
  return ret;
};

var update = function (...slotValuePairs) {
  slotValuePairs.forEach(function ([slot, value]) {
    slot.value = value;
  });
  // find all the slots that depends on, remove duplicates and refresh them
  var toUpdate = [];
  slotValuePairs.map(([slot, value]) => slot.children).forEach(function (children) {
    children.forEach(function (child) {
      if (!(child.__id in toUpdate)) {
        toUpdate[child.__id] = child;
      }
    });
  });
  toUpdate.forEach((slot) => slot.refresh.apply(slot));
};

export default (function (p) {
  p.slot = makeSlot;
  p.connect = connect;
  p.update = update;
  return p;
})((initial) => makeSlot(initial));
