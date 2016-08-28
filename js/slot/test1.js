(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('ava')) :
  typeof define === 'function' && define.amd ? define(['ava'], factory) :
  (factory(global.test));
}(this, function (test) { 'use strict';

  test = 'default' in test ? test['default'] : test;

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

  var arrFlatten = arr => arr.reduce((sum, i) => sum.concat(i), []);

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
            this.offsprings[i.id], level
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
        delete parent.chilren[self.id];
        console.log(parent.children[self.id]);
      }
    }
    console.log('asdasdasd', 'ok');
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
    self.valueFunc = valueFunc;
    slots.forEach(function (slot) {
      slot.addChild(self);
    });
    // initialize
    self.value = self.valueFunc.apply(
      self,
      slots.map(parent => parent.val())
    );
    // update ancestors' update path by each level
    var ancestors = {};
    for (
      var parents = arrFlatten(slots.map( i => i.parents )), level = 2; 
    parents.length; parents = arrFlatten(parents.map( i => objectValues(i.parents) )), level++) {
      for (var parent of parents) {
        if (!(parent.id in ancestors)) {
          ancestors[parent.id] = parent;
        }
        if (self.id in parent.offsprings) {
          parent.offsprings[self.id].level = Math.max(parent.offsprings[self.id].level, level);
        } else {
          parent.offsprings[self.id] = {
            slot: self,
            level: level,
          };
        }
      }
    }
    // organize offsprings by level for each ancestors
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
    return self;
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

  var $$ = (function (p) {
    p.slot = Slot;
    p.connect = connect;
    p.update = update;
    p.init = init;
    return p;
  })((initial, tag) => new Slot(initial, tag));

  test('basic', function (t) {
    var $$s1 = $$(1);
    t.is($$s1.val(), 1);

  });

  test('connect1', function (t) {
    var $$s1 = $$(1);
    var $$s2 = $$(2);
    var $$s3 = $$().connect([$$s1, $$s2], function (s1, s2) {
      return s1 + s2; 
    });
    t.is($$s3.val(), 3);
  });

  test('connect2', function (t) {
    $$.init({ debug: true });
    var $$s1 = $$(1, 's1');
    var $$s2 = $$(2, 's2');
    var $$s3 = $$(null, 's3').connect([$$s1, $$s2], function (s1, s2) {
      return s1 + s2; 
    });

    var $$s4 = $$(null, 's4').connect([$$s1, $$s2, $$s3], function (s1, s2, s3) {
      return s1 + s2 + s3;
    });

    t.is($$s4.val(), 6);

    $$s1.val(2);
    t.is($$s4.val(), 8);
  });

  test('connect3', function (t) {
    $$.init({ debug: true });
    var $$s1 = $$(1, 's1');
    var $$s2 = $$(2, 's2');

    var $$s4 = $$(null, 's4').connect([$$s1], function (s1) {
      return s1 * 2;
    });
    console.log('weoiuroiu');
    $$s4.connect([$$s2], function (s2) {
      return s2 * 2;
    });
    return;

    t.is($$s4.val(), 4);

    $$s1.val(2);
    t.is($$s4.val(), 4);

    $$s2.val(3);
    t.is($$s4.val(), 6);
  });

}));