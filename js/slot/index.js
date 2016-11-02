var _uniqueId = function () {
  var i = 1;
  return function (prefix='') {
    return prefix + i++;
  };
}();

var isEmptyObject = function (obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

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
Slot.prototype.hasChildren = function () {
  return objectValues(this.children).length > 0;
};

Slot.prototype.change = function (proc) {
  this.onChangeCbs.push(proc);
  return this;
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
    this.debug && console.info(`slot: slot ${this.tag} updated -- `, this.value, '->', newValue);
    var oldValue = this.value;
    this.value = newValue;
    this.onChangeCbs.forEach(function (cb) {
      cb.call(this, newValue, oldValue);
    });
    if (objectValues(this.children).length == 1) {
      objectValues(this.children)[0].update();
      return oldValue;
    }
    if (this.offspringsByLevels.length === 0) {
      this.calcOffsprings();
    }
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
        slot.debug && console.info(`slot: slot ${slot.tag} will be refreshed`);
        if (!slot.refresh(initiators)) {
          cleanSlots[slot.id] = slot;
        }
      }
    }
    return oldValue;
  }
};

Slot.prototype.update = function () {
  if (this.valueFunc) {
    this.value = this.valueFunc.apply(
      this,
      [this.parents.map(parent => parent.val())]
    );
  }
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

var calcOffsprings = function calcOffsprings(from) {
  var affected = {};
  for (let slot of from) {
    for (let parent of slot.parents) {
      affected[parent.id] = parent;
    }
  }

  for (var id in affected) {
    let slot = affected[id];
    slot.calcOffsprings();
  }
};

Slot.prototype.calcOffsprings = function () {
  this.offsprings = {};
  if (this.children.length <= 1) {
    return;
  }
  // level by level
  for (
    let offsprings = objectValues(this.children), level = 1;
    offsprings.length;
    offsprings = collectDirectChildren(offsprings), ++level
  )  {
    for (let i of offsprings) {
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
  let currentLevel = 0;
  var slots;
  for (let { slot, level } of objectValues(this.offsprings).sort((a, b) => a.level - b.level)) {
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
    cb.call(this, this.value, oldValue, initiators);
  }
  return true;
};

Slot.prototype.patch = function (obj) {
  this.debug && console.info(`slot: slot ${this.tag} is about to be patched`, obj);
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

Slot.prototype.map = function (f) {
  return new Proxy(this, {
    get(target, name) {
      if (name == 'value') {
        return f(target.value);
      }
      return target[name];
    }
  });
};

Slot.prototype.connect = function (slots, valueFunc, parentsCalcOffsprings=false) {
  let self = this;
  self.valueFunc = valueFunc;
  // affected slots are parents/un-parents
  let affected = {};
  for (let slot of slots) {
    affected[slot.id] = slot;
  }
  for (let parent of self.parents) {
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
  if (!parentsCalcOffsprings) {
    self.parents.forEach(function (parent) {
      parent.offsprings = {};
      parent.offspringsByLevels = [];
    });
    return self;
  }
  // re-collect ancestors/un-ancestors
  let unvisited = objectValues(affected);
  while (unvisited.length) {
    let slot = unvisited.shift();
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
var connect = function connect(slots, valueFunc, tag, changed, parentsCalcOffsprings=false) {
  var self = new Slot(null, tag, changed);
  return self.connect(slots, valueFunc, parentsCalcOffsprings);
};

var update = function (...slotValuePairs) {
  let cleanSlots = {};
  slotValuePairs.forEach(function ([slot, value]) {
    slot.debug && console.info(`slot ${slot.tag} changed`, slot.value, value);
    let oldValue = slot.value;
    slot.value = value;
    if (slot.changed && !slot.changed(oldValue, value)) {
      cleanSlots[slot.id] = slot;
      return;
    }
    for (var cb of slot.onChangeCbs) {
      cb.call(slot, value, oldValue);
    }
  });
  let relatedSlots = {};
  let addToRelatedSlots = function (slot, level) {
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
    if (isEmptyObject(slot.offsprings)) {
      slot.calcOffsprings();
    }
    objectValues(slot.offsprings).forEach(function ({slot: offspring, level}) {
      addToRelatedSlots(offspring, level);
    });
  });

  // order offsprings by level
  let levels = [];
  let slots;
  let currentLevel = 0;
  objectValues(relatedSlots).sort((a, b) => a.level - b.level).forEach(function ({slot, level}) {
    if (level > currentLevel) {
      slots = [];
      levels.push(slots);
      currentLevel = level;
    }
    slots.push(slot);
  });
  let mayChange = {};
  for (let k in relatedSlots) {
    mayChange[k] = true;
  }
  for (let [slot] of slotValuePairs) {
    mayChange[slot.id] = true;
  }
  for (let level of levels) {
    for (let slot of level) {
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
      slot.debuggable && console.info(`slot: slot ${slot.tag} will be refreshed`);
      if (!slot.refresh(initiators)) {
        cleanSlots[slot.id] = slot;
      }
    }
  }
};

export default (function ($$) {
  $$.Slot = Slot;
  $$.slot = function (...args) {
    return new Slot(args);
  };
  $$.connect = connect;
  $$.calcOffsprings = calcOffsprings;
  $$.update = update;
  return $$;
})((initial, tag, changed) => new Slot(initial, tag, changed));
