var _uniqueId = function () {
  var i = 1;
  return function (prefix='') {
    return prefix + i++;
  };
}();

var objectValues = function (obj) {
  if (Object.values) {
    return Object.values(obj);
  }
  var values = [];
  for (let key in obj){
    if (obj.hasOwnProperty(key)) {
      values.push(obj[key]);
    }
  }
  return values;
};

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
Slot.prototype.val = function val(newValue) {
  if (newValue === void 0) {
    if (this.value === void 0 && this.valueFunc) {
      this.value = this.valueFunc.apply(
        this, [this.parents.map(it => it.val())]
      );
    }
    return this.value;
  } else {
    if (this.changed && !this.changed(this.value, newValue)) {
      return this.value;
    }
    this.debug && console.info(
      `slot: slot ${this.tag} updated -- `, this.value, '->', newValue
    );
    var oldValue = this.value;
    this.value = newValue;
    this.onChangeCbs.forEach(function (cb) {
      cb.call(this, newValue, oldValue);
    });
    if (objectValues(this.children).length == 1) {
      objectValues(this.children)[0].refresh(null, true);
      return oldValue;
    }
    if (this.offspringsByLevels === void 0 || this.offsprings === void 0) {
      this.calcOffsprings();
    }
    let cleanSlots = {};
    let updateRoot = this;
    for (var level of this.offspringsByLevels) {
      for (var slot of level) {
        let dirty = slot.parents.some(function (parent) {
          // parent is updateRoot or (is in this update and dirty)
          return (parent.id == updateRoot.id) ||
            (updateRoot.offsprings[parent.id] && !cleanSlots[parent.id]);
        });
        if (!dirty) {
          cleanSlots[slot.id] = slot;
          continue;
        }
        let initiators = slot.parents.filter(function (parent) {
          return parent.id === updateRoot.id ||
            updateRoot.offsprings[parent.id];
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
  for (let { slot, level } of objectValues(this.offsprings)
       .sort((a, b) => a.level - b.level)) {
    if (level > currentLevel) {
      slots = [];
      this.offspringsByLevels.push(slots);
      currentLevel = level;
    }
    slots.push(slot);
  }
  return this;
};

Slot.prototype.refresh = function (initiators, propogation=false) {
  let oldValue = this.value;
  if (this.valueFunc) {
    let args = [this.parents.map(parent => parent.val())];
    initiators && args.push(initiators);
    this.value = this.valueFunc.apply(
      this,
      args
    );
  }
  if (this.changed && !this.changed(oldValue, this.value)) {
    return false;
  }
  if (propogation) {
    this.val(this.value);
  } else {
    for (let cb of this.onChangeCbs) {
      cb.call(this, this.value, oldValue, initiators);
    }
  }
  return true;
};

Slot.prototype.on = function on() {
  this.val(true);
};

Slot.prototype.off = function() {
  this.val(false);
};

Slot.prototype.patch = function (obj) {
  this.debug && console.info(
    `slot: slot ${this.tag} is about to be patched`, obj
  );
  this.val(Object.assign(this.val(), obj));
};

Slot.prototype.delete = function (...fields) {
  for (let field of fields) {
    delete this.value[field];
  }
  this.val(this.value);
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

Slot.prototype.trans = function (p, tag) {
  return connect([this], function ([slot]) {
    return p(slot);
  }, tag);
};

Slot.prototype.map = function (f) {
  // since proxy will use field 'value', so let it initialized
  if (this.value === void 0 && this.valueFunc) {
    this.value = this.valueFunc.apply(
      this, [this.parents.map(it => it.val())]
    );
  }
  return new Proxy(this, {
    get(target, name) {
      if (name == 'value') {
        return f(target.value);
      }
      return target[name];
    }
  });
};

Slot.prototype.connect = function (slots, valueFunc, lazy=true) {
  let self = this;
  self.value = void 0;
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
  if (!lazy) {
    self.value = self.valueFunc.apply(
      self,
      [self.parents.map(parent => parent.val())]
    );
  }
  // make ancestors' offsprings obsolete
  self.getAncestors().forEach(function (ancestor) {
    ancestor.offsprings = void 0;
    ancestor.offspringsByLevels = void 0;
  });
  return self;
};

Slot.prototype.getAncestors = function() {
  let ancestors = {};
  for (let parent of this.parents) {
    if (!ancestors[parent.id]) {
      ancestors[parent.id] = parent;
      for (let ancestor of parent.getAncestors()) {
        ancestors[ancestor.id] = ancestor;
      }
    }
  }
  return objectValues(ancestors);
};



/**
 * note! a child has only one chance to setup its parents
 * */
var connect = function connect(
  slots, valueFunc, tag, changed, lazy=true
) {
  var self = new Slot(null, tag, changed);
  return self.connect(slots, valueFunc, lazy);
};

var update = function (...slotValuePairs) {
  let cleanSlots = {};
  slotValuePairs.forEach(function ([slot, value]) {
    slot.debug && console.info(`slot ${slot.tag} changed`, slot.value, value);
    let oldValue = slot.value;
    if (value !== void 0) {
      slot.value = value;
      if (slot.changed && !slot.changed(oldValue, value)) {
        cleanSlots[slot.id] = slot;
        return;
      }
    }
    for (var cb of slot.onChangeCbs) {
      cb.call(slot, slot.value, oldValue);
    }
  });
  let relatedSlots = {};
  let addToRelatedSlots = function (slot, level) {
    if (slot.id in relatedSlots) {
      relatedSlots[slot.id].level = Math.max(level,
                                             relatedSlots[slot.id].level);
    } else {
      relatedSlots[slot.id] = {
        slot,
        level,
      };
    }
  };
  slotValuePairs.forEach(function ([slot]) {
    if (slot.offsprings === void 0) {
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
  objectValues(relatedSlots).sort((a, b) => a.level - b.level)
  .forEach(function ({slot, level}) {
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
      slot.debuggable && console.info(
        `slot: slot ${slot.tag} will be refreshed`
      );
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
