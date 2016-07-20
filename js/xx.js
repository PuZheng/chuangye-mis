var _uniqueId = function () {
  var i = 1;
  return function () {
    return i++;
  };
}();

/**
 * collect offsprings by levels
 * */
var collectOffsprings = function (...slots) {
  var offsprings = {};
  var collectOffspringsWithLevel = function collectOffspringsWithLevel(slots, level) {
    slots.forEach(function (slot) {
      if (!(slot.id in offsprings)) {
        offsprings[slot.id] = {
          slot,
          level
        };
      } else {
        offsprings[slot.id].level = Math.max(offsprings[slot.id].level, level);
      }
      slot.children.length && collectOffspringsWithLevel(slot.children, level + 1);
    });
  };
  slots.forEach(function (slot) {
    collectOffspringsWithLevel(slot.children, 0);
  });
  var ret = [];
  var currentLevel = -1;
  var slots;
  var offspringsOrderedByLevel = Object.keys(offsprings).map(
    (k) => offsprings[k]).sort((a, b) => a.level - b.level);
  offspringsOrderedByLevel.forEach(function ({slot, level}) {
    if (level > currentLevel) {
      slots = [];
      ret.push(slots);
      currentLevel = level;
    }
    slots.push(slot);
  });
  return ret;
};

var makeSlot = function (initial) {
  var slot = function (newValue) {
    if (newValue === undefined) {
      return slot.value;
    } else {
      opt.debug && console.debug(`xx: slot ${slot.tag} updated`, slot.value, newValue);
      var oldValue = slot.value;
      slot.value = newValue; 
      slot.onChangeCbs.forEach(function (cb) {
        cb(newValue);
      });
      collectOffsprings(slot).forEach(function (slots) {
        slots.forEach((slot) => {
          opt.debug && console.debug(`xx: slot ${slot.tag} will be refreshed`);
          slot.refresh();
        });
      });
      return oldValue;
    }
  };
  slot.value = initial;
  slot.onChangeCbs = [];
  slot.change = function (onChange) {
    slot.onChangeCbs.push(onChange);
  };
  slot.children = [];
  slot.id = _uniqueId();
  slot.tag = function (tag) {
    slot.tag = tag;
    return slot;
  };
  return slot;
};

var connect = function () {
  var args = [...arguments];
  var ret = makeSlot();
  ret.valueFunc = args[args.length - 1];
  var slots = args.slice(0, args.length - 1);
  slots.forEach(function (slot) {
    slot.children.push(ret);
  });
  ret.refresh = function () {
    ret.value = ret.valueFunc(...slots.map((slot) => slot.apply(slot)));
    ret.onChangeCbs.forEach(function (cb) {
      cb(ret.value);
    });
  };
  return ret;
};

var update = function (...slotValuePairs) {
  slotValuePairs.forEach(function ([slot, value]) {
    opt.debug && console.debug(`slot ${slot.tag} updated`, slot.value, value);
    slot.value = value;
  });
  // order offsprings by level
  collectOffsprings(...slotValuePairs.map(([slot, value]) => slot)).forEach(function (slots) {
    slots.forEach(function (slot) {
      opt.debug && console.debug(`xx: slot ${slot.tag} will be refreshed`);
      slot.refresh();
    });
  });
};

var opt = {};

var init = function (opt_ = {}) {
  opt.debug = !!opt_.debug;
};

export default (function (p) {
  p.slot = makeSlot;
  p.connect = connect;
  p.update = update;
  p.init = init;
  return p;
})((initial) => makeSlot(initial));
