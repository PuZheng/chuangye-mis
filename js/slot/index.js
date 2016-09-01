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

var Slot = function (initial, tag, changed) {
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
  this.changed = changed;
};

Slot.prototype.isRoot = function () {
  return this.parents.length == 0;
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
    if (this.changed && !this.changed(this.value, newValue)) {
      return this.value;
    }
    opt.debug && console.info(`slot: slot ${this.tag} updated -- `, this.value, '->', newValue);
    var oldValue = this.value;
    this.value = newValue; 
    this.onChangeCbs.forEach(function (cb) {
      cb.call(this, newValue);
    });
    let cleanSlots = {};
    let updateRoot = this;
    for (var level of this.offspringsByLevels) {
      for (var slot of level) {
        let dirty = slot.parents.some(function (parent) {
          // parent is updateRoot or (is in this update and dirty)
          return (parent.id == updateRoot.id) || (updateRoot.offsprings[parent.id] && !cleanSlots[parent.id]);
        });
        if (!dirty) {
          cleanSlots[slot.id] = slot;
          continue;
        }
        let initiators = slot.parents.filter(function (parent) {
          return parent.id === updateRoot.id || updateRoot.offsprings[parent.id];
        });
        opt.debug && console.info(`slot: slot ${slot.tag} will be refreshed`);
        if (!slot.refresh(initiators)) {
          cleanSlots[slot.id] = slot;
        }
      }
    }
    return oldValue;
  }
};

Slot.prototype.update = function () {
  this.val(this.value);
};

var collectDirectChildren = function collectDirectChildren(slots) {
  let ret = {};
  for (let o of slots) {
    for (let k in o.children) {
      let child = o.children[k];
      ret[child.id] = child;
    }
  }
  return objectValues(ret);
};

Slot.prototype.calcOffsprings = function calcOffsprings() {
  this.offsprings = {};
  // level by level
  for (
    var offsprings = objectValues(this.children), level = 1; 
    offsprings.length; 
    offsprings = collectDirectChildren(offsprings), ++level
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

Slot.prototype.refresh = function (initiators) {
  let args = [this.parents.map(parent => parent.val())];
  args.push(initiators);
  let oldValue = this.value;
  this.value = this.valueFunc.apply(
    this,
    args
  );
  if (this.changed && !this.changed(oldValue, this.value)) {
    return false;
  }
  for (var cb of this.onChangeCbs) {
    cb(this.value, initiators);
  }
  return true;
};

Slot.prototype.patch = function (obj) {
  console.info(`slot: slot ${this.tag} is about to be patched`, obj);
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
  return connect([this], function ([slot]) {
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
    [self.parents.map(parent => parent.val())]
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
var connect = function connect(slots, valueFunc, tag, changed) {
  var self = new Slot(null, tag, changed);
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
  let cleanSlots = {};
  let mayChange = {};
  for (var k in relatedSlots) {
    mayChange[k] = true;
  }
  for (var [slot] of slotValuePairs) {
    mayChange[slot.id] = true;
  }
  for (var level of levels) {
    for (var slot of level) {
      let dirty = slot.parents.some(function (parent) {
        return mayChange[parent.id] && !cleanSlots[parent.id];
      });
      if (!dirty) {
        cleanSlots[slot.id] = slot;
        continue;
      }
      let initiators = slot.parents.filter(function (parent) {
        return relatedSlots[parent.id];
      });
      opt.debug && console.info(`slot: slot ${slot.tag} will be refreshed`);
      if (!slot.refresh(initiators)) {
        cleanSlots[slot.id] = slot;
      }
    }
  }
};

var opt = {};

var init = function (opt_ = {}) {
  opt.debug = !!opt_.debug;
};

export default (function ($$) {
  $$.Slot = Slot;
  $$.slot = function (...args) {
    return new Slot(args);
  };
  $$.connect = connect;
  $$.update = update;
  $$.init = init;
  return $$;
})((initial, tag, changed) => new Slot(initial, tag, changed));
