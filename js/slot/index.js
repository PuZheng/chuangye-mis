var _uniqueId = function () {
  var i = 1;
  return function (prefix="") {
    return prefix + i++;
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

var Slot = function (initial, tag) {
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
  this.tag = tag;
  this.token = this.tag + '-' + this.id;
};

Slot.prototype.change = function (proc) {
  this.onChangeCbs.push(proc);
};

Slot.prototype.offChange = function (proc) {
  this.onChangeCbs = this.onChangeCbs.filter(cb => cb != proc);
};
Slot.prototype.val = function (newValue) {
  if (newValue === undefined) {
    return this.value;
  } else {
    opt.debug && console.info(`xx: slot ${this.tag} updated -- `, this.value, '->', newValue);
    var oldValue = this.value;
    this.value = newValue; 
    this.onChangeCbs.forEach(function (cb) {
      cb.call(this, newValue);
    });
    for (var level of this.offspringsByLevels) {
      for (var slot of level) {
        opt.debug && console.info(`xx: slot ${slot.tag} will be refreshed`);
        slot.refresh();
      }
    }
    return oldValue;
  }
};

Slot.prototype.update = function () {
  this.val(this.valueFunc.apply(
    this,
    this.parents.map(parent => parent.val())
  ));
};

Slot.prototype.calcOffsprings = function () {
  this.offsprings = {};
  for (
    var offsprings = objectValues(this.children), level = 1; 
    offsprings.length; 
    offsprings = function () {
      let ret = {};
      for (var i of offsprings) {
        for (var j of objectValues(i.children)) {
          if (!(j.id in ret)) {
            ret[j.id] = j;
          }
        }
      }
      return objectValues(ret);
    }(offsprings), ++level
  )  {
    for (var i of offsprings) {
      if (!(i.id in this.offsprings)) {
        this.offsprings[i.id] = {
          slot: i,
          level: level
        };
      } else {
        this.offsprings[i.id].level = Math.max(
          this.offsprings[i.id].level, level
        );
      }
    }
  }
  this.offspringsByLevels = [];
  var currentLevel = 0;
  var slots;
  for (var { slot, level } of objectValues(this.offsprings).sort((a, b) => a.level - b.level)) {
    if (level > currentLevel) {
      slots = [];
      this.offspringsByLevels.push(slots);
      currentLevel = level;
    }
    slots.push(slot);
  }
  return this;
};

Slot.prototype.refresh = function () {
  this.value = this.valueFunc.apply(
    this,
    this.parents.map(parent => parent.val())
  );
  for (var cb of this.onChangeCbs) {
    cb(this.value);
  }
};

Slot.prototype.patch = function (obj) {
  console.info(`xx: slot ${this.tag} is about to be patched`, obj);
  this.val(Object.assign(this.val(), obj));
};

Slot.prototype.inc = function (cnt=1) {
  this.val(this.val() + cnt);
};

Slot.prototype.dec = function (cnt=1) {
  this.val(this.val() - cnt);
};

Slot.prototype.toggle = function () {
  this.val(!this.val());
};

Slot.prototype.trans = function (p, label) {
  return connect([this], function (slot) {
    return p(slot);
  }, label);
};

Slot.prototype.connect = function (slots, valueFunc) {
  var self = this;
  self.valueFunc = valueFunc;
  // affected slots are parents/un-parents
  var affected = {};
  for (var slot of slots) {
    affected[slot.id] = slot;
  }
  for (var parent of self.parents) {
    if (slots.every(function (s) {
      return s !== parent;
    })) {
      affected[parent.id] = parent;
      delete parent.children[self.id];
    }
  }
  // setup parents
  self.parents = [];
  slots.forEach(function (slot) {
    self.parents.push(slot);
    slot.children[self.id] = self;
  });
  // initialize
  self.value = self.valueFunc.apply(
    self,
    self.parents.map(parent => parent.val())
  );
  // re-collect ancestors/un-ancestors
  var unvisited = objectValues(affected);
  while (unvisited.length) {
    var slot = unvisited.shift();
    for (var parent of slot.parents) {
      if (!(parent.id in affected)) {
        affected[parent.id] = parent;
        unvisited.push(parent);
      }
    }
  }
  objectValues(affected).forEach(function (slot) {
    slot.calcOffsprings();
  });
  return self;
};


/**
 * note! a child has only one chance to setup its parents
 * */
var connect = function connect(slots, valueFunc, tag) {
  var self = new Slot(null, tag);
  return self.connect(slots, valueFunc);
};

var update = function (...slotValuePairs) {
  slotValuePairs.forEach(function ([slot, value]) {
    opt.debug && console.info(`slot ${slot.tag} changed`, slot.value, value);
    slot.value = value;
    for (var cb of slot.onChangeCbs) {
      cb.call(slot, value);
    }
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
  slotValuePairs.forEach(function ([slot]) {
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
      opt.debug && console.info(`xx: slot ${slot.tag} will be refreshed`);
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
})((initial, tag) => new Slot(initial, tag));
