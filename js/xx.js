var uniqueId = function () {
  var i = 1;
  return function () {
    return i++;
  };
}();

var makeSlot = function (initial) {
  var slot = function (newValue) {
    if (newValue === undefined) {
      return slot.value;
    } else {
      var oldValue = slot.value;
      slot.value = newValue; 
      slot.onChangeCbs.forEach(function (cb) {
        cb(newValue);
      });
      slot.cbs.forEach(function (cb) {
        cb(newValue);
      });
      return oldValue;
    }
  };
  slot.value = initial;
  slot.cbs = [];
  slot.onChangeCbs = [];
  slot.change = function (onChange) {
    slot.onChangeCbs.push(onChange);
  };
  slot.children = [];
  slot.id = uniqueId();
  slot.tag = function (tag) {
    slot.tag = tag;
    return slot;
  };
  return slot;
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
    ret.apply(ret, [computeValue(...slots.map((slot) => slot.apply(slot)))]);
  };
  return ret;
};

var update = function (...slotValuePairs) {
  slotValuePairs.forEach(function ([slot, value]) {
    slot.value = value;
  });
  // find all the slots that depends on, remove duplicates and refresh them
  var toUpdate = {};
  slotValuePairs.forEach(function ([slot, value]) {
    slot.children.forEach(function (child) {
      if (!(child.id in toUpdate)) {
        toUpdate[child.id] = child;
      }
    });
  });
  for (var id in toUpdate) {
    toUpdate[id].refresh();
  }
};

export default (function (p) {
  p.slot = makeSlot;
  p.connect = connect;
  p.update = update;
  return p;
})((initial) => makeSlot(initial));
