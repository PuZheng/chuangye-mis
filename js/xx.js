var _uniqueId = function () {
  var i = 1;
  return function () {
    return i++;
  };
}();


var objectValues = obj => (Object.values?  obj => Object.values(obj): function (obj) {
  var values = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      values.push(obj[key]);
    }
  }
  return values;
})(obj);

var arrFlatten = arr => arr.reduce((sum, i) => sum.concat(i));

var getLast = arr => arr[arr.length - 1];

var addChild = function (parent, child) {
  // note!!! we assume no circle, that means, 
  // child don't connect to any ancestors
  child.parents.push(parent);
  if (!(child.id in parent.children)) {
    parent.children[child.id] = child;
    // since a child's parent is set only once, 
    // so it is safe to say that child is a immediate child to parent  
    parent.offsprings[child.id] = {
      slot: child,
      level: 1,
    };
    if (parent.offspringsByLevels.length === 0) {
      parent.offspringsByLevels.push([]);
    }
    getLast(parent.offspringsByLevels).push(child);
  }
};


var Slot = function (initial) {
  if (!(this instanceof Slot)) {
    return new Slot();
  }
  this.id = _uniqueId();
  this.value = initial;
  this.onChangeCbs = [];
  this.parents = [];
  this.children = {};
  this.offsprings = {};
  this.offspringsByLevels = [];
};

Slot.prototype.change = function (proc) {
  this.onChangeCbs.push(proc);
  return this;
};

Slot.prototype.setTag = function (tag) {
  this.tag = tag;
  return this;
};

Slot.prototype.val = function (newValue) {
    if (newValue === undefined) {
      return this.value;
    } else {
      opt.debug && console.debug(`xx: slot ${this.tag} updated`, this.value, newValue);
      var oldValue = this.value;
      this.value = newValue; 
      this.onChangeCbs.forEach(function (cb) {
        cb(newValue);
      });
      for (var level of this.offspringsByLevels) {
        for (var slot of level) {
          opt.debug && console.debug(`xx: slot ${slot.tag} will be refreshed`);
          slot.refresh();
        }
      }
      return oldValue;
    }
};

Slot.prototype.refresh = function () {
  this.value = this.valueFunc.apply(
    null,
    this.parents.map(parent => parent.val())
  );
  for (var cb of this.onChangeCbs) {
    cb(this.value);
  }
};

Slot.prototype.patch = function (obj) {
  this.val(Object.assign(this.val(), obj));
};


/**
 * note! a child has only one chance to setup its parents
 * */
var connect = function connect() {
  var args = [...arguments];
  var ret = new Slot();
  ret.valueFunc = args[args.length - 1];
  var slots = args.slice(0, args.length - 1);
  slots.forEach(function (slot) {
    addChild(slot, ret);
  });
  // update ancestors update calculation path each level
  var ancestors = {};
  for (
    var parents = arrFlatten(slots.map( i => i.parents )), level = 2; 
  parents.length; parents = arrFlatten(parents.map( i => objectValues(i.parents) )), level++) {
    for (var parent of parents) {
      if (!(parent.id in ancestors)) {
        ancestors[parent.id] = parent;
      }
      if (ret.id in parent.offsprings) {
        parent.offsprings[ret.id].level = Math.max(parent.offsprings[ret.id].level, level);
      } else {
        parent.offsprings[ret.id] = {
          slot: ret,
          level: level,
        };
      }
    }
  }
  // order offsprings by level for each ancestors
  for (var ancestor of objectValues(ancestors)) {
    ancestor.offspringsByLevels = [];
    var currentLevel = 0;
    var slots;

    objectValues(ancestor.offsprings).sort((a, b) => a.level - b.level).forEach(function ({slot, level}) {
      if (level > currentLevel) {
        slots = [];
        ancestor.offspringsByLevels.push(slots);
        currentLevel = level;
      }
      slots.push(slot);
    });
  }
  return ret;
};

var update = function (...slotValuePairs) {
  slotValuePairs.forEach(function ([slot, value]) {
    opt.debug && console.debug(`slot ${slot.tag} updated`, slot.value, value);
    slot.value = value;
  });
  var relatedSlots = {};
  var addToRelatedSlots = function (slot, level) {
      if (slot.id in relatedSlots) {
        relatedSlots[slot.id].level = Math.max(level, relatedSlots[slot.id].level);
      } else {
        relatedSlots[slot.id] = {
          slot,
          level,
        };
      }
  };
  slotValuePairs.forEach(function ([slot, value]) {
    objectValues(slot.offsprings).forEach(function ({slot: offspring, level}) {
      addToRelatedSlots(offspring, level);
    });
  });

  // order offsprings by level
  var levels = [];
  var slots;
  var currentLevel = 0;
  objectValues(relatedSlots).sort((a, b) => a.level - b.level).forEach(function ({slot, level}) {
    if (level > currentLevel) {
      slots = [];
      levels.push(slots);
      currentLevel = level;
    }
    slots.push(slot);
  });
  for (var level of levels) {
    for (var slot of level) {
      opt.debug && console.debug(`xx: slot ${slot.tag} will be refreshed`);
      slot.refresh();
    }
  }
};

var opt = {};

var init = function (opt_ = {}) {
  opt.debug = !!opt_.debug;
};

export default (function (p) {
  p.slot = Slot;
  p.connect = connect;
  p.update = update;
  p.init = init;
  return p;
})((initial) => new Slot(initial));
